import mongoose, { Document, Schema } from "mongoose";

export interface IVerificationLog extends Document {
  certificateId?: string;
  uploadedFileHash?: string;
  verificationResult: "VALID" | "INVALID_TAMPERED" | "REVOKED" | "NOT_FOUND" | "PENDING_OR_UNAVAILABLE";
  verificationMethod: "id" | "pdf_upload" | "qr_scan";
  verifiedAt: Date;
}

const VerificationLogSchema = new Schema<IVerificationLog>(
  {
    certificateId: { type: String, index: true },
    uploadedFileHash: { type: String, index: true },
    verificationResult: {
      type: String,
      enum: ["VALID", "INVALID_TAMPERED", "REVOKED", "NOT_FOUND", "PENDING_OR_UNAVAILABLE"],
      required: true,
      index: true,
    },
    verificationMethod: {
      type: String,
      enum: ["id", "pdf_upload", "qr_scan"],
      required: true,
    },
    verifiedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const VerificationLog = mongoose.model<IVerificationLog>("VerificationLog", VerificationLogSchema);
