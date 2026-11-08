import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
