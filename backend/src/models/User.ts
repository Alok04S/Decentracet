import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "issuer" | "student" | "verifier";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  institutionId?: mongoose.Types.ObjectId;
  studentId?: string; // e.g. "ENR-2022-8921"
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "issuer", "student", "verifier"],
      default: "student",
      required: true,
    },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution" },
    studentId: { type: String, trim: true },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = mongoose.model<IUser>("User", UserSchema);
