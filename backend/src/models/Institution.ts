import mongoose, { Document, Schema } from "mongoose";

export interface IInstitution extends Document {
  name: string;
  officialEmailDomain: string;
  address: string;
  website: string;
  authorizedIssuers: string[]; // List of authorized issuer email addresses or wallet addresses
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InstitutionSchema = new Schema<IInstitution>(
  {
    name: { type: String, required: true, trim: true },
    officialEmailDomain: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    website: { type: String, required: true },
    authorizedIssuers: [{ type: String, trim: true }],
    logoUrl: { type: String },
  },
  { timestamps: true }
);

export const Institution = mongoose.model<IInstitution>("Institution", InstitutionSchema);
