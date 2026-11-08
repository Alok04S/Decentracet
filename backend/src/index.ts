import { app } from "./app";
import { ENV } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { blockchainClient } from "./config/blockchain";
import { reconciliationService } from "./services/reconciliationService";

async function bootstrap() {
  console.log("==================================================");
  console.log("Starting DecentraCert Backend Service");
  console.log(`Environment: ${ENV.NODE_ENV}`);
  console.log("==================================================");

  // 1. Connect MongoDB
  await connectDatabase();

  // 2. Validate Blockchain Network & Contract
  const health = await blockchainClient.getHealth();
  console.log("--------------------------------------------------");
  console.log("Blockchain Diagnostics:");
  console.log(`  RPC Connected: ${health.connected}`);
  console.log(`  Network: ${health.networkName} (Chain ID: ${health.chainId ?? "N/A"})`);
  console.log(`  Target Contract: ${health.contractAddress || "None"}`);
  console.log(`  Contract Deployed Bytecode: ${health.isContractDeployed ? "Verified" : "Missing / Not Deployed"}`);
  console.log(`  Latest Block: ${health.latestBlock ?? "N/A"}`);
  if (health.errorMessage) {
    console.warn(`  Diagnostic Warning: ${health.errorMessage}`);
  }
  console.log("--------------------------------------------------");

  // 3. Start Server
  const server = app.listen(ENV.PORT, () => {
    console.log(`🚀 DecentraCert API running at http://localhost:${ENV.PORT}`);
    console.log(`📄 Health Check: http://localhost:${ENV.PORT}/api/health`);
    console.log("==================================================");
  });

  // 4. Background Transaction Reconciler (Runs every 60 seconds)
  const reconciliationInterval = setInterval(async () => {
    try {
      await reconciliationService.reconcilePendingTransactions();
    } catch (err: any) {
      console.warn("Background reconciliation cycle error:", err.message);
    }
  }, 60000);

  // Graceful Shutdown
  const shutdown = async () => {
    console.log("\nInitiating graceful shutdown...");
    clearInterval(reconciliationInterval);
    server.close(async () => {
      await disconnectDatabase();
      console.log("DecentraCert API shut down gracefully.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((err) => {
  console.error("❌ Fatal error during bootstrap:", err);
  process.exit(1);
});
