import { Certificate, ICertificate } from "../models/Certificate";
import { AuditLog } from "../models/AuditLog";
import { blockchainClient } from "../config/blockchain";
import { storageRepository } from "./storageRepository";
import { isDatabaseConnected } from "../config/database";

export interface ReconciliationReport {
  scanned: number;
  recovered: number;
  failed: number;
  stillPending: number;
  details: Array<{
    certificateId: string;
    action: string;
    transactionHash?: string;
    status: string;
  }>;
}

export class ReconciliationService {
  /**
   * Reconciles a single certificate against live on-chain state.
   */
  public async reconcileCertificate(cert: any): Promise<{ updated: boolean; status: string; reason?: string }> {
    const provider = blockchainClient.getProvider();
    const readContract = blockchainClient.getReadOnlyContract();

    if (!provider || !readContract) {
      return { updated: false, status: cert.blockchainStatus, reason: "Blockchain provider unavailable" };
    }

    // Case 1: Transaction hash is recorded, verify receipt
    if (cert.transactionHash) {
      try {
        const receipt = await provider.getTransactionReceipt(cert.transactionHash);

        if (receipt) {
          if (receipt.status === 1) {
            // Transaction succeeded on-chain, confirm contract state
            const [exists, isValid, isRevoked, issuer, issuedAt] = await readContract.verifyCertificate(cert.blockchainHash);

            if (exists) {
              cert.blockchainStatus = "confirmed";
              cert.blockNumber = receipt.blockNumber;
              cert.issuerAddress = receipt.from;
              if (isRevoked) {
                cert.certificateStatus = "revoked";
              }
              if (typeof cert.save === "function") {
                await cert.save();
              }
              await storageRepository.updateCertificate(cert.certificateId, {
                blockchainStatus: "confirmed",
                blockNumber: receipt.blockNumber,
                issuerAddress: receipt.from,
                ...(isRevoked ? { certificateStatus: "revoked" } : {}),
              });

              storageRepository.addAuditLog({
                actorId: cert.institutionId || "system",
                actorEmail: "system@reconciliation",
                action: "RECONCILE_TRANSACTION_RECOVERED",
                entityType: "Certificate",
                entityId: cert.certificateId,
                metadata: {
                  transactionHash: cert.transactionHash,
                  blockNumber: receipt.blockNumber,
                  previousStatus: "submitting",
                },
              });

              return { updated: true, status: "confirmed" };
            }
          } else {
            // Transaction reverted on-chain
            cert.blockchainStatus = "failed";
            if (typeof cert.save === "function") {
              await cert.save();
            }
            await storageRepository.updateCertificate(cert.certificateId, {
              blockchainStatus: "failed",
            });
            return { updated: true, status: "failed", reason: "Transaction reverted on chain" };
          }
        }
      } catch (err: any) {
        console.warn(`[Reconciler] Receipt check failed for ${cert.certificateId}:`, err.message);
      }
    }

    // Case 2: Even if txHash was lost during DB disconnect, check if hash was actually registered on-chain
    try {
      const [exists, isValid, isRevoked, issuer] = await readContract.verifyCertificate(cert.blockchainHash);
      if (exists) {
        cert.blockchainStatus = "confirmed";
        cert.issuerAddress = issuer;
        if (isRevoked) {
          cert.certificateStatus = "revoked";
        }
        if (typeof cert.save === "function") {
          await cert.save();
        }
        await storageRepository.updateCertificate(cert.certificateId, {
          blockchainStatus: "confirmed",
          issuerAddress: issuer,
          ...(isRevoked ? { certificateStatus: "revoked" } : {}),
        });

        storageRepository.addAuditLog({
          actorId: cert.institutionId || "system",
          actorEmail: "system@reconciliation",
          action: "RECONCILE_HASH_FOUND_ONCHAIN",
          entityType: "Certificate",
          entityId: cert.certificateId,
          metadata: {
            blockchainHash: cert.blockchainHash,
            issuer,
          },
        });

        return { updated: true, status: "confirmed" };
      }
    } catch (err: any) {
      console.warn(`[Reconciler] On-chain hash check error for ${cert.certificateId}:`, err.message);
    }

    return { updated: false, status: cert.blockchainStatus };
  }

  /**
   * Scans all pending/submitting records and reconciles them.
   */
  public async reconcilePendingTransactions(): Promise<ReconciliationReport> {
    let pendingCerts: any[] = [];
    if (isDatabaseConnected) {
      try {
        pendingCerts = await Certificate.find({
          blockchainStatus: { $in: ["submitting", "draft"] },
          isDemoRecord: false,
        });
      } catch {
        pendingCerts = [];
      }
    } else {
      pendingCerts = storageRepository
        .queryCertificates({ limit: 1000 })
        .data.filter((c: any) => ["submitting", "draft"].includes(c.blockchainStatus) && !c.isDemoRecord);
    }

    const report: ReconciliationReport = {
      scanned: pendingCerts.length,
      recovered: 0,
      failed: 0,
      stillPending: 0,
      details: [],
    };

    for (const cert of pendingCerts) {
      const res = await this.reconcileCertificate(cert);
      if (res.updated) {
        if (res.status === "confirmed") {
          report.recovered++;
          report.details.push({
            certificateId: cert.certificateId,
            action: "RECOVERED_TO_CONFIRMED",
            transactionHash: cert.transactionHash,
            status: "confirmed",
          });
        } else if (res.status === "failed") {
          report.failed++;
          report.details.push({
            certificateId: cert.certificateId,
            action: "MARKED_FAILED",
            transactionHash: cert.transactionHash,
            status: "failed",
          });
        }
      } else {
        report.stillPending++;
        report.details.push({
          certificateId: cert.certificateId,
          action: "STILL_PENDING",
          transactionHash: cert.transactionHash,
          status: cert.blockchainStatus,
        });
      }
    }

    return report;
  }
}

export const reconciliationService = new ReconciliationService();
