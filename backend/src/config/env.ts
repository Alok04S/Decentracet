import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const envSchema = z.object({
  PORT: z.string().default("5000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/decentracert"),
  USE_IN_MEMORY_DB: z.string().default("false").transform((val) => val === "true"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CHAIN_ID: z.string().default("31337").transform((val) => parseInt(val, 10)),
  RPC_URL: z.string().default("http://127.0.0.1:8545"),
  PRIVATE_KEY: z.string().default(""),
  CONTRACT_ADDRESS: z.string().default(""),
  STORAGE_DIR: z.string().default("./uploads/certificates"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid configuration");
}

export const ENV = parsed.data;
