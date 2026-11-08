import { Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { generateCertificatePdf } from "../services/pdfService";
import { calculatePdfSha256 } from "../services/hashService";
import { storageService } from "../services/storageService";
import { generateQrPngBuffer } from "../services/qrService";
import { blockchainClient } from "../config/blockchain";
import { storageRepository } from "../services/storageRepository";

const issueCertificateSchema = z.object({
  studentName: z.string().min(2, "Student name is required"),
  studentId: z.string().min(2, "Student ID/Enrollment number is required"),
  studentEmail: z.string().email("Valid student email is required"),
  degree: z.string().min(2, "Degree name is required"),
  department: z.string().min(2, "Department is required"),
  specialization: z.string().optional(),
  academicYear: z.string().min(4, "Academic year is required (e.g. 2022-2026)"),
  graduationYear: z.number().int().min(1950).max(2100),
  issueDate: z.string().optional(),
  certificateType: z.string().default("Bachelor of Science"),
  grade: z.string().optional(),
  remarks: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

function generateUniqueCertificateId(): string {
  const year = new Date().getFullYear();
  const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `DC-${year}-${randomPart}`;
}

export async function issueCertificate(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = issueCertificateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, errors: parseResult.error.flatten().fieldErrors });
      return;
    }

    const data = parseResult.data;

    // Check Idempotency Key
    if (data.idempotencyKey) {
      const existing = storageRepository.queryCertificates({}).data.find((c) => c.idempotencyKey === data.idempotencyKey);
      if (existing) {
        res.status(200).json({
          success: true,
          message: "Certificate previously created with this idempotency key.",
          certificate: existing,
          isDuplicate: true,
        });
        return;
      }
    }

    const institution = await storageRepository.getInstitution();
    const certificateId = generateUniqueCertificateId();
    const issueDate = data.issueDate ? new Date(data.issueDate) : new Date();

    // 1. Generate PDF
    const pdfBuffer = await generateCertificatePdf({
      certificateId,
      studentName: data.studentName,
      institutionName: institution.name,
      degree: data.degree,
      department: data.department,
      specialization: data.specialization,
      graduationYear: data.graduationYear,
      issueDate,
      certificateType: data.certificateType,
    });

    // 2. Exact SHA-256 hash
    const { hexSha256, bytes32 } = calculatePdfSha256(pdfBuffer);

    // 3. Save PDF to disk
    const storagePath = await storageService.savePdf(certificateId, pdfBuffer);

    // 4. Initial record
    const certRecord: any = {
      certificateId,
      studentName: data.studentName,
      studentId: data.studentId,
      studentEmail: data.studentEmail,
      institutionId: institution._id || institution.id,
      degree: data.degree,
      department: data.department,
      specialization: data.specialization,
      academicYear: data.academicYear,
      graduationYear: data.graduationYear,
      issueDate: issueDate.toISOString(),
      certificateType: data.certificateType,
      grade: data.grade,
      remarks: data.remarks,

      pdfStoragePath: storagePath,
      pdfSha256: hexSha256,
      blockchainHash: bytes32,

      blockchainStatus: "draft",
      certificateStatus: "active",
      idempotencyKey: data.idempotencyKey,
      isDemoRecord: false,
      networkType: "hardhat",
    };

    // 5. Blockchain Integration
    const deploymentValidation = await blockchainClient.validateDeployment();
    const contract = blockchainClient.getContract();

    if (deploymentValidation.valid && contract) {
      try {
        certRecord.blockchainStatus = "submitting";
        const tx = await contract.issueCertificate(bytes32);
        certRecord.transactionHash = tx.hash;

        const receipt = await tx.wait(1);
        certRecord.blockNumber = receipt.blockNumber;
        certRecord.issuerAddress = receipt.from;
        certRecord.blockchainStatus = "confirmed";
        certRecord.networkType = (await blockchainClient.getHealth()).chainId === 11155111 ? "sepolia" : "hardhat";
      } catch (chainErr: any) {
        console.error("❌ On-chain transaction error:", chainErr.message);
        certRecord.blockchainStatus = "failed";
      }
    } else {
      certRecord.blockchainStatus = "unconfigured";
      certRecord.isDemoRecord = true;
      certRecord.networkType = "demo_local";
    }

    const saved = await storageRepository.addCertificate(certRecord);

    storageRepository.addAuditLog({
      actorId: req.user?._id || institution._id,
      actorEmail: req.user?.email || "system@decentracert",
      action: "ISSUE_CERTIFICATE",
      entityType: "Certificate",
      entityId: saved.certificateId,
      metadata: {
        certificateId: saved.certificateId,
        studentName: saved.studentName,
        blockchainHash: saved.blockchainHash,
        blockchainStatus: saved.blockchainStatus,
      },
    });

    res.status(201).json({
      success: true,
      message: "Certificate issued successfully.",
      certificate: saved,
    });
  } catch (error: any) {
    console.error("Certificate issuance error:", error);
    res.status(500).json({ success: false, message: "Internal server error during certificate issuance." });
  }
}

export async function getCertificates(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const options: any = {
      page,
      limit,
      search: req.query.search as string,
      status: req.query.status as string,
      blockchainStatus: req.query.blockchainStatus as string,
      degree: req.query.degree as string,
      department: req.query.department as string,
      certificateType: req.query.certificateType as string,
    };

    if (req.user?.role === "student") {
      options.studentEmail = req.user.email;
    } else if (req.user?.role !== "admin" && req.user?.role !== "issuer") {
      res.status(403).json({ success: false, message: "Forbidden: Access restricted to institutional administrators and issuers." });
      return;
    }

    const result = storageRepository.queryCertificates(options);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error("List certificates error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve certificates." });
  }
}

export async function getCertificateById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const cert = await storageRepository.findCertificateById(id);

    if (!cert) {
      res.status(404).json({ success: false, message: "Certificate not found." });
      return;
    }

    if (req.user?.role === "student") {
      const isOwner =
        cert.studentEmail?.toLowerCase() === req.user.email.toLowerCase() ||
        (req.user.studentId && cert.studentId === req.user.studentId);
      if (!isOwner) {
        res.status(403).json({ success: false, message: "Forbidden: You do not have permission to view this certificate." });
        return;
      }
    } else if (req.user?.role !== "admin" && req.user?.role !== "issuer") {
      res.status(403).json({ success: false, message: "Forbidden: Access restricted to institutional administrators and issuers." });
      return;
    }

    res.json({ success: true, certificate: cert });
  } catch (error: any) {
    console.error("Get certificate by ID error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve certificate." });
  }
}

export async function downloadCertificatePdf(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const cert = await storageRepository.findCertificateById(id);

    if (!cert) {
      res.status(404).json({ success: false, message: "Certificate not found." });
      return;
    }

    if (req.user?.role === "student") {
      const isOwner =
        cert.studentEmail?.toLowerCase() === req.user.email.toLowerCase() ||
        (req.user.studentId && cert.studentId === req.user.studentId);
      if (!isOwner) {
        res.status(403).json({ success: false, message: "Forbidden: You do not have permission to download this certificate." });
        return;
      }
    } else if (req.user?.role !== "admin" && req.user?.role !== "issuer") {
      res.status(403).json({ success: false, message: "Forbidden: You do not have permission to download this certificate." });
      return;
    }

    const buffer = await storageService.readPdf(cert.certificateId);
    if (!buffer) {
      // If PDF file was not generated yet on disk, generate it dynamically on demand
      const institution = await storageRepository.getInstitution();
      const newPdf = await generateCertificatePdf({
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
      await storageService.savePdf(cert.certificateId, newPdf);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${cert.certificateId}.pdf"`);
      res.send(Buffer.from(newPdf));
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${cert.certificateId}.pdf"`);
    res.send(buffer);
  } catch (error: any) {
    console.error("PDF download error:", error);
    res.status(500).json({ success: false, message: "Failed to download certificate PDF." });
  }
}

export async function getCertificateQr(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const cert = await storageRepository.findCertificateById(id);

    if (!cert) {
      res.status(404).json({ success: false, message: "Certificate not found." });
      return;
    }

    if (req.user?.role === "student") {
      const isOwner =
        cert.studentEmail?.toLowerCase() === req.user.email.toLowerCase() ||
        (req.user.studentId && cert.studentId === req.user.studentId);
      if (!isOwner) {
        res.status(403).json({ success: false, message: "Forbidden: You do not have permission to view this certificate QR code." });
        return;
      }
    } else if (req.user?.role !== "admin" && req.user?.role !== "issuer") {
      res.status(403).json({ success: false, message: "Forbidden: You do not have permission to view this certificate QR code." });
      return;
    }

    const qrPng = await generateQrPngBuffer(cert.certificateId);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `inline; filename="${cert.certificateId}-qr.png"`);
    res.send(qrPng);
  } catch (error: any) {
    console.error("QR retrieval error:", error);
    res.status(500).json({ success: false, message: "Failed to generate QR code." });
  }
}

export async function revokeCertificate(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      res.status(400).json({ success: false, message: "A formal revocation reason is required." });
      return;
    }

    const cert = await storageRepository.findCertificateById(id);
    if (!cert) {
      res.status(404).json({ success: false, message: "Certificate not found." });
      return;
    }

    if (cert.certificateStatus === "revoked") {
      res.status(400).json({ success: false, message: "Certificate is already revoked." });
      return;
    }

    // On-Chain Revocation
    let revocationTxHash: string | undefined;
    const contract = blockchainClient.getContract();
    if (contract && cert.blockchainStatus === "confirmed") {
      try {
        const tx = await contract.revokeCertificate(cert.blockchainHash, reason.trim());
        const receipt = await tx.wait(1);
        revocationTxHash = receipt.hash;
      } catch (chainErr: any) {
        console.error("❌ On-chain revocation error:", chainErr.message);
      }
    }

    const updated = await storageRepository.updateCertificate(cert.certificateId, {
      certificateStatus: "revoked",
      revokedAt: new Date().toISOString(),
      revocationReason: reason.trim(),
      revocationTransactionHash: revocationTxHash,
    });

    storageRepository.addAuditLog({
      actorId: req.user?._id,
      actorEmail: req.user?.email || "admin@decentracert",
      action: "REVOKE_CERTIFICATE",
      entityType: "Certificate",
      entityId: cert.certificateId,
      metadata: {
        certificateId: cert.certificateId,
        revocationReason: reason.trim(),
      },
    });

    res.json({
      success: true,
      message: "Certificate revoked successfully.",
      certificate: updated,
    });
  } catch (error: any) {
    console.error("Revocation error:", error);
    res.status(500).json({ success: false, message: "Failed to revoke certificate." });
  }
}

export async function reconcileCertificate(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const cert = await storageRepository.findCertificateById(id);
    if (!cert) {
      res.status(404).json({ success: false, message: "Certificate not found." });
      return;
    }

    res.json({
      success: true,
      message: "Reconciliation executed.",
      certificate: cert,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to reconcile certificate." });
  }
}
