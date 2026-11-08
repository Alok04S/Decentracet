import mongoose, { Document, Schema } from "mongoose";

export type BlockchainStatus = "draft" | "submitting" | "confirmed" | "failed" | "unconfigured";
export type CertificateStatus = "active" | "revoked";

export interface ICertificate extends Document {
  certificateId: string;
  studentName: string;
  studentId: string;
  studentEmail: string;
  institutionId: mongoose.Types.ObjectId;
  degree: string;
  department: string;
  specialization?: string;
  academicYear: string;
  graduationYear: number;
  issueDate: Date;
  certificateType: string;
  grade?: string;
  remarks?: string;

  pdfStoragePath: string;
  pdfSha256: string;
  blockchainHash: string; // 0x-prefixed bytes32

  transactionHash?: string;
  blockNumber?: number;
  issuerAddress?: string;

  blockchainStatus: BlockchainStatus;
  certificateStatus: CertificateStatus;

  idempotencyKey?: string;
  isDemoRecord: boolean;
  networkType: "sepolia" | "hardhat" | "demo_local";

  revokedAt?: Date;
  revocationReason?: string;
  revocationTransactionHash?: string;

  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateId: { type: String, required: true, unique: true, index: true },
    studentName: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true, index: true },
    studentEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
    degree: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    specialization: { type: String, trim: true },
    academicYear: { type: String, required: true, trim: true },
    graduationYear: { type: Number, required: true },
    issueDate: { type: Date, required: true },
    certificateType: { type: String, required: true, default: "Bachelor of Science" },
    grade: { type: String, trim: true },
    remarks: { type: String, trim: true },

    pdfStoragePath: { type: String, required: true },
    pdfSha256: { type: String, required: true, index: true },
    blockchainHash: { type: String, required: true, index: true },

    transactionHash: { type: String, sparse: true, index: true },
    blockNumber: { type: Number },
    issuerAddress: { type: String },

    blockchainStatus: {
      type: String,
      enum: ["draft", "submitting", "confirmed", "failed", "unconfigured"],
      default: "draft",
      index: true,
    },
    certificateStatus: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
      index: true,
    },

    idempotencyKey: { type: String, sparse: true, unique: true },
    isDemoRecord: { type: Boolean, default: false, index: true },
    networkType: {
      type: String,
      enum: ["sepolia", "hardhat", "demo_local"],
      default: "hardhat",
    },

    revokedAt: { type: Date },
    revocationReason: { type: String },
    revocationTransactionHash: { type: String },
  },
  { timestamps: true }
);

// Indexes for high performance searching
CertificateSchema.index({ studentName: "text", degree: "text", department: "text" });

export const Certificate = mongoose.model<ICertificate>("Certificate", CertificateSchema);
