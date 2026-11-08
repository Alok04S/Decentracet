import { Response } from "express";
import { Certificate } from "../models/Certificate";
import { blockchainClient } from "../config/blockchain";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function getBlockchainStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const health = await blockchainClient.getHealth();
    const sanitizedHealth = {
      ...health,
      errorMessage: health.errorMessage ? "Ethereum RPC node is unreachable or offline." : undefined,
    };
    res.json({ success: true, health: sanitizedHealth });
  } catch (error: any) {
    console.error("Blockchain status error:", error);
    res.status(500).json({ success: false, message: "Failed to query blockchain status." });
  }
}

export async function getBlockchainTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const skip = (page - 1) * limit;

    // Only fetch records with genuine on-chain transaction hashes
    const filter = {
      $or: [
        { transactionHash: { $exists: true, $ne: null } },
        { revocationTransactionHash: { $exists: true, $ne: null } },
      ],
      isDemoRecord: false,
    };

    const certificates = await Certificate.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const transactions: any[] = [];

    for (const cert of certificates) {
      if (cert.transactionHash) {
        transactions.push({
          certificateId: cert.certificateId,
          studentName: cert.studentName,
          transactionHash: cert.transactionHash,
          type: "CERTIFICATE_ISSUANCE",
          blockNumber: cert.blockNumber,
          issuerAddress: cert.issuerAddress,
          timestamp: cert.issueDate,
          status: cert.blockchainStatus === "confirmed" ? "CONFIRMED" : "PENDING",
          network: cert.networkType,
          etherscanUrl:
            cert.networkType === "sepolia" && cert.transactionHash
              ? `https://sepolia.etherscan.io/tx/${cert.transactionHash}`
              : null,
        });
      }

      if (cert.revocationTransactionHash) {
        transactions.push({
          certificateId: cert.certificateId,
          studentName: cert.studentName,
          transactionHash: cert.revocationTransactionHash,
          type: "CERTIFICATE_REVOCATION",
          blockNumber: cert.blockNumber ? cert.blockNumber + 1 : undefined,
          issuerAddress: cert.issuerAddress,
          timestamp: cert.revokedAt,
          status: "CONFIRMED",
          network: cert.networkType,
          etherscanUrl:
            cert.networkType === "sepolia" && cert.revocationTransactionHash
              ? `https://sepolia.etherscan.io/tx/${cert.revocationTransactionHash}`
              : null,
        });
      }
    }

    const total = await Certificate.countDocuments(filter);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Blockchain transactions error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch blockchain transactions." });
  }
}
