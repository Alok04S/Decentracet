import { ICertificate } from "../models/Certificate";
import { IInstitution } from "../models/Institution";

export interface PublicVerificationResponse {
  certificateId: string;
  studentName: string;
  institutionName: string;
  degree: string;
  department: string;
  specialization?: string;
  academicYear: string;
  graduationYear: number;
  issueDate: string;
  certificateType: string;

  verificationResult: "VALID" | "INVALID_TAMPERED" | "REVOKED" | "NOT_FOUND" | "PENDING_OR_UNAVAILABLE";
  verificationMessage: string;

  // Cryptographic & Blockchain Evidence
  pdfSha256: string;
  blockchainHash: string;
  isHashMatch: boolean;
  blockchainStatus: string;
  networkType: string;
  contractAddress: string;
  transactionHash?: string;
  blockNumber?: number;
  issuerAddress?: string;

  revocationStatus: {
    isRevoked: boolean;
    revokedAt?: string;
    revocationReason?: string;
    revocationTransactionHash?: string;
  };

  isDemoRecord: boolean;
  verifiedAt: string;
}

/**
 * Sanitizes a Certificate document for public exposure.
 * Strictly excludes: studentEmail, studentId (enrollment number), internal MongoDB _id,
 * internal filesystem paths, internal remarks.
 */
export function sanitizePublicCertificate(
  cert: ICertificate,
  institution: IInstitution | null,
  verificationResult: "VALID" | "INVALID_TAMPERED" | "REVOKED" | "NOT_FOUND" | "PENDING_OR_UNAVAILABLE",
  verificationMessage: string,
  isHashMatch: boolean,
  contractAddress: string
): PublicVerificationResponse {
  return {
    certificateId: cert.certificateId,
    studentName: cert.studentName,
    institutionName: institution ? institution.name : "Accredited University Partner",
    degree: cert.degree,
    department: cert.department,
    specialization: cert.specialization,
    academicYear: cert.academicYear,
    graduationYear: cert.graduationYear,
    issueDate: cert.issueDate instanceof Date ? cert.issueDate.toISOString() : new Date(cert.issueDate || Date.now()).toISOString(),
    certificateType: cert.certificateType,

    verificationResult,
    verificationMessage,

    pdfSha256: cert.pdfSha256,
    blockchainHash: cert.blockchainHash,
    isHashMatch,
    blockchainStatus: cert.blockchainStatus,
    networkType: cert.networkType,
    contractAddress,
    transactionHash: cert.transactionHash,
    blockNumber: cert.blockNumber,
    issuerAddress: cert.issuerAddress,

    revocationStatus: {
      isRevoked: cert.certificateStatus === "revoked",
      revokedAt: cert.revokedAt ? (cert.revokedAt instanceof Date ? cert.revokedAt.toISOString() : new Date(cert.revokedAt).toISOString()) : undefined,
      revocationReason: cert.certificateStatus === "revoked" ? cert.revocationReason : undefined,
      revocationTransactionHash: cert.revocationTransactionHash,
    },

    isDemoRecord: cert.isDemoRecord,
    verifiedAt: new Date().toISOString(),
  };
}
