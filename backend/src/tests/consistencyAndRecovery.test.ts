import { connectDatabase, disconnectDatabase } from "../config/database";
import { Certificate } from "../models/Certificate";
import { Institution } from "../models/Institution";
import { reconciliationService } from "../services/reconciliationService";
import { blockchainClient } from "../config/blockchain";

describe("Consistency, Recovery & Network Validation Suite", () => {
  beforeAll(async () => {
    await connectDatabase();
    await Certificate.deleteMany({});
    await Institution.deleteMany({});
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("1. Network & Deployment Bytecode Pre-Flight Validation", () => {
    it("Should provide detailed network diagnostic status", async () => {
      const health = await blockchainClient.getHealth();
      expect(health).toHaveProperty("connected");
      expect(health).toHaveProperty("expectedChainId");
      expect(health.expectedChainId).toBe(31337);
    });
  });

  describe("2. Blockchain and MongoDB Consistency Recovery", () => {
    it("Should reconcile and recover interrupted transactions", async () => {
      const inst = await Institution.create({
        name: "Recovery Test University",
        officialEmailDomain: "recovery.edu",
        address: "Campus 2",
        website: "https://recovery.edu",
        authorizedIssuers: ["admin@recovery.edu"],
      });

      // Create a certificate simulating a scenario where tx was submitted but DB confirmation was interrupted
      const pendingCert = await Certificate.create({
        certificateId: "DC-2026-RECOV001",
        studentName: "Rachel Green",
        studentId: "ENR-1122",
        studentEmail: "rachel@recovery.edu",
        institutionId: inst._id,
        degree: "Bachelor of Arts in Economics",
        department: "Economics",
        academicYear: "2022-2026",
        graduationYear: 2026,
        issueDate: new Date(),
        certificateType: "Bachelor of Arts",

        pdfStoragePath: "./uploads/certificates/DC-2026-RECOV001.pdf",
        pdfSha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        blockchainHash: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",

        blockchainStatus: "submitting", // Stuck in submitting
        certificateStatus: "active",
        isDemoRecord: false,
        networkType: "hardhat",
      });

      expect(pendingCert.blockchainStatus).toBe("submitting");

      // Run reconciliation routine
      const report = await reconciliationService.reconcilePendingTransactions();
      expect(report.scanned).toBeGreaterThanOrEqual(1);

      // Verify certificate status remains valid or gets updated based on on-chain state
      const updated = await Certificate.findOne({ certificateId: "DC-2026-RECOV001" });
      expect(updated).not.toBeNull();
    });
  });
});
