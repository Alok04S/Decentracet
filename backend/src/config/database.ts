import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ENV } from "./env";

let mongodInstance: MongoMemoryServer | null = null;
let cachedUri: string | null = null;
export let isDatabaseConnected = false;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    isDatabaseConnected = true;
    return;
  }

  let uri = ENV.MONGODB_URI;

  if (ENV.USE_IN_MEMORY_DB || ENV.NODE_ENV === "test") {
    try {
      if (!mongodInstance) {
        mongodInstance = await MongoMemoryServer.create({
          binary: { version: "6.0.14" },
        });
        cachedUri = mongodInstance.getUri();
      }
      uri = cachedUri || mongodInstance.getUri();
    } catch (e: any) {
      console.warn("⚠️ In-memory MongoDB could not be spawned (likely blocked by local Antivirus/Firewall):", e.message);
    }
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isDatabaseConnected = true;
    mongoose.set("bufferCommands", true);
    console.log(`✅ Connected to MongoDB successfully at ${uri.replace(/\/\/.*@/, "//***@")}`);
  } catch (error: any) {
    isDatabaseConnected = false;
    mongoose.set("bufferCommands", false);
    console.warn("--------------------------------------------------");
    console.warn("⚠️  MONGODB NOT RUNNING (Antivirus / Local Service Alert)");
    console.warn(`   Target URI: ${uri}`);
    console.warn("   Notice: The server will run in Standalone/Demo mode.");
    console.warn("");
    console.warn("   TO CONNECT FULL DATABASE (Choose One):");
    console.warn("   1. MongoDB Atlas (Recommended - 100% Free, Zero Firewall/Antivirus Block):");
    console.warn("      Create a free cluster at https://www.mongodb.com/cloud/atlas");
    console.warn("      Paste MONGODB_URI=mongodb+srv://... in backend/.env");
    console.warn("   2. Official MongoDB Community Server:");
    console.warn("      Start the official Windows service: net start MongoDB");
    console.warn("--------------------------------------------------");
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export async function stopMemoryServer(): Promise<void> {
  if (mongodInstance) {
    try {
      await mongodInstance.stop();
    } catch {}
    mongodInstance = null;
    cachedUri = null;
  }
}
