import { Request, Response } from "express";
import { Certificate, ICertificate } from "../models/Certificate";
import { Institution } from "../models/Institution";
import { VerificationLog } from "../models/VerificationLog";
import { calculatePdfSha256 } from "../services/hashService";
import { sanitizePublicCertificate } from "../services/sanitizerService";
import { blockchainClient } from "../config/blockchain";
import { ENV } from "../config/env";
import { storageService } from "../services/storageService";
import { storageRepository } from "../services/storageRepository";

/**
 * Public Verification by Certificate ID
 */
export async function verifyById(req: Request, res: Response): Promise<void> {
  try {
    const { certificateId } = req.body;

    if (!certificateId || typeof certificateId !== "string") {
      res.status(400).json({ success: false, message: "Valid Certificate ID is required." });
      return;
    }

    const cleanId = certificateId.trim().toUpperCase();
    const cert = await storageRepository.findCertificateById(cleanId);

    if (!cert) {
      storageRepository.addVerificationLog({
        certificateId: cleanId,
        verificationResult: "NOT_FOUND",
        verificationMethod: "id",
      });

      res.status(404).json({
        success: false,
        verificationResult: "NOT_FOUND",
        message: `No credential record was found matching Certificate ID '${cleanId}'.`,
      });
      return;
    }

    const institution = await storageRepository.getInstitution();
    const readContract = blockchainClient.getReadOnlyContract();
    const health = await blockchainClient.getHealth();

    let verificationResult: "VALID" | "INVALID_TAMPERED" | "REVOKED" | "NOT_FOUND" | "PENDING_OR_UNAVAILABLE" = "VALID";
    let verificationMessage = "Credential is authentic and successfully confirmed on-chain.";
    let isHashMatch = true;

    // Check Revocation status first
    if (cert.certificateStatus === "revoked") {
      verificationResult = "REVOKED";
      const revokedDateStr = cert.revokedAt
        ? cert.revokedAt instanceof Date
          ? cert.revokedAt.toISOString()
          : String(cert.revokedAt)
        : "record";
      verificationMessage = `This credential has been officially revoked by the issuing institution on ${revokedDateStr}. Reason: ${
        cert.revocationReason || "Administrative decision"
      }`;
    } else if (cert.blockchainStatus === "unconfigured" || cert.isDemoRecord) {
      verificationResult = "VALID";
      verificationMessage = "Verified against local credential registry (Unanchored Development Record).";
    } else if (!readContract || !health.connected) {
      verificationResult = "PENDING_OR_UNAVAILABLE";
      verificationMessage = "Blockchain node connection is currently unavailable. Credential cannot be verified on-chain at this time.";
    } else {
      // Query Smart Contract View
      try {
        const [exists, isValid, isRevoked, issuer, issuedAt] = await readContract.verifyCertificate(cert.blockchainHash);

        if (!exists) {
          verificationResult = "PENDING_OR_UNAVAILABLE";
          verificationMessage = "Credential record exists in institution database but has not yet been confirmed on the Ethereum ledger.";
        } else if (isRevoked) {
          verificationResult = "REVOKED";
          verificationMessage = "Smart contract confirms this credential has been revoked.";
        } else if (isValid) {
          verificationResult = "VALID";
          verificationMessage = "Cryptographic integrity and Ethereum ledger state independently verified.";
        }
      } catch (chainErr: any) {
        console.warn("Blockchain query error during verification:", chainErr.message);
        verificationResult = "PENDING_OR_UNAVAILABLE";
        verificationMessage = "Unable to reach blockchain RPC node to verify on-chain state.";
      }
    }

    storageRepository.addVerificationLog({
      certificateId: cert.certificateId,
      uploadedFileHash: cert.pdfSha256,
      verificationResult,
      verificationMethod: "id",
    });

    const sanitized = sanitizePublicCertificate(
      cert,
      institution,
      verificationResult,
      verificationMessage,
      isHashMatch,
      health.contractAddress
    );

    res.json({
      success: true,
      data: sanitized,
    });
  } catch (error: any) {
    console.error("Verify by ID error:", error);
    res.status(500).json({ success: false, message: "Internal server error during verification." });
  }
}

/**
 * Public Verification by PDF Upload (Byte-for-byte SHA-256 integrity check)
 */
export async function verifyByPdf(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file || !req.file.buffer) {
      res.status(400).json({ success: false, message: "A valid PDF document file must be uploaded." });
      return;
    }

    const { certificateId } = req.body;
    const uploadedBuffer = req.file.buffer;

    // Calculate exact byte-level SHA-256
    const { hexSha256, bytes32 } = calculatePdfSha256(uploadedBuffer);

    let cert: any = null;

    if (certificateId && typeof certificateId === "string" && certificateId.trim().length > 0) {
      cert = await storageRepository.findCertificateById(certificateId.trim().toUpperCase());
    } else {
      cert = await storageRepository.findCertificateByHash(hexSha256);
    }

    if (!cert) {
      storageRepository.addVerificationLog({
        uploadedFileHash: hexSha256,
        verificationResult: "NOT_FOUND",
        verificationMethod: "pdf_upload",
      });

      res.status(404).json({
        success: false,
        verificationResult: "NOT_FOUND",
        message: "No credential registered with the calculated cryptographic SHA-256 hash.",
        calculatedHash: hexSha256,
        calculatedBytes32: bytes32,
      });
      return;
    }

    const institution = await storageRepository.getInstitution();
    const readContract = blockchainClient.getReadOnlyContract();
    const health = await blockchainClient.getHealth();

    // Check for Byte-Level Tampering
    const isHashMatch = cert.pdfSha256.toLowerCase() === hexSha256.toLowerCase();

    if (!isHashMatch) {
      storageRepository.addVerificationLog({
        certificateId: cert.certificateId,
        uploadedFileHash: hexSha256,
        verificationResult: "INVALID_TAMPERED",
        verificationMethod: "pdf_upload",
      });

      const sanitized = sanitizePublicCertificate(
        cert,
        institution,
        "INVALID_TAMPERED",
        "Cryptographic Integrity Failure: The uploaded PDF bytes do not match the registered SHA-256 hash. The document has been modified, tampered with, or corrupted.",
        false,
        health.contractAddress
      );

      res.status(400).json({
        success: false,
        verificationResult: "INVALID_TAMPERED",
        message: "Cryptographic Integrity Failure: The uploaded PDF document does not match the registered hash.",
        data: sanitized,
        comparison: {
          uploadedPdfSha256: hexSha256,
          registeredPdfSha256: cert.pdfSha256,
          registeredBlockchainHash: cert.blockchainHash,
          matches: false,
        },
      });
      return;
    }

    // Exact Match! Now check revocation and blockchain status
    let verificationResult: "VALID" | "INVALID_TAMPERED" | "REVOKED" | "NOT_FOUND" | "PENDING_OR_UNAVAILABLE" = "VALID";
    let verificationMessage = "Authentic Credential: Exact byte-level cryptographic SHA-256 hash verified.";

    if (cert.certificateStatus === "revoked") {
      verificationResult = "REVOKED";
      verificationMessage = `Authentic document, but this credential has been officially REVOKED by the institution. Reason: ${
        cert.revocationReason || "Revoked by authority"
      }`;
    } else if (cert.blockchainStatus === "unconfigured" || cert.isDemoRecord) {
      verificationResult = "VALID";
      verificationMessage = "Exact cryptographic match verified against institutional repository (Development Record).";
    } else if (!readContract || !health.connected) {
      verificationResult = "PENDING_OR_UNAVAILABLE";
      verificationMessage = "Exact cryptographic file match verified, but Ethereum RPC node is currently unreachable.";
    } else {
      try {
        const [exists, isValid, isRevoked] = await readContract.verifyCertificate(cert.blockchainHash);
        if (!exists) {
          verificationResult = "PENDING_OR_UNAVAILABLE";
          verificationMessage = "Hash matches institutional document, but Ethereum block confirmation is pending.";
        } else if (isRevoked) {
          verificationResult = "REVOKED";
          verificationMessage = "Smart contract confirms this credential has been revoked.";
        } else if (isValid) {
          verificationResult = "VALID";
          verificationMessage = "Exact byte-for-byte SHA-256 hash verified and validated against Ethereum smart contract.";
        }
      } catch (err: any) {
        verificationResult = "PENDING_OR_UNAVAILABLE";
        verificationMessage = "Blockchain query could not be completed at this time.";
      }
    }

    storageRepository.addVerificationLog({
      certificateId: cert.certificateId,
      uploadedFileHash: hexSha256,
      verificationResult,
      verificationMethod: "pdf_upload",
    });

    const sanitized = sanitizePublicCertificate(
      cert,
      institution,
      verificationResult,
      verificationMessage,
      true,
      health.contractAddress
    );

    res.json({
      success: true,
      data: sanitized,
      comparison: {
        uploadedPdfSha256: hexSha256,
        registeredPdfSha256: cert.pdfSha256,
        registeredBlockchainHash: cert.blockchainHash,
        matches: true,
      },
    });
  } catch (error: any) {
    console.error("Verify by PDF error:", error);
    res.status(500).json({ success: false, message: "Internal server error during PDF verification." });
  }
}

/**
 * Public PDF Download for Verified Credential
 */
export async function downloadPublicPdf(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      res.status(400).json({ success: false, message: "Valid Certificate ID is required." });
      return;
    }

    const cleanId = id.trim().toUpperCase();
    const cert = await storageRepository.findCertificateById(cleanId);

    if (!cert) {
      res.status(404).json({ success: false, message: "Certificate not found." });
      return;
    }

    let buffer: Buffer | null = await storageService.readPdf(cert.certificateId);
    if (!buffer) {
      const { generateCertificatePdf } = await import("../services/pdfService");
      const institution = await storageRepository.getInstitution();
      const generated = await generateCertificatePdf({
        certificateId: cert.certificateId,
        studentName: cert.studentName,
        institutionName: institution.name,
        degree: cert.degree,
        department: cert.department,
        specialization: cert.specialization,
        graduationYear: cert.graduationYear,
        issueDate: new Date(cert.issueDate),
        certificateType: cert.certificateType,
      });
      buffer = Buffer.from(generated);
      await storageService.savePdf(cert.certificateId, buffer);
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${cert.certificateId}.pdf"`);
    res.send(buffer);
  } catch (error: any) {
    console.error("Public PDF download error:", error);
    res.status(500).json({ success: false, message: "Failed to download PDF." });
  }
}

/**
 * Public QR Code Retrieval for Verified Credential
 */
export async function getPublicQr(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      res.status(400).json({ success: false, message: "Valid Certificate ID is required." });
      return;
    }

    const cleanId = id.trim().toUpperCase();
    const cert = await storageRepository.findCertificateById(cleanId);

    if (!cert) {
      res.status(404).json({ success: false, message: "Certificate not found." });
      return;
    }

    const { generateQrPngBuffer } = await import("../services/qrService");
    const qrPng = await generateQrPngBuffer(cert.certificateId);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `inline; filename="${cert.certificateId}-qr.png"`);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(qrPng);
  } catch (error: any) {
    console.error("Public QR retrieval error:", error);
    res.status(500).json({ success: false, message: "Failed to generate QR code." });
  }
}
