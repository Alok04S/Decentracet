import request from "supertest";
import { app } from "../app";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { Certificate } from "../models/Certificate";
import { Institution } from "../models/Institution";
import { generateCertificatePdf } from "../services/pdfService";
import { calculatePdfSha256 } from "../services/hashService";
import { storageService } from "../services/storageService";

describe("Cryptographic Byte Tamper Detection Suite", () => {
  const testCertId = "DC-2026-TAMPER01";
  let originalPdfBuffer: Buffer;
  let originalHash: { hexSha256: string; bytes32: string };

  beforeAll(async () => {
    await connectDatabase();
    await Certificate.deleteMany({ certificateId: testCertId });

    let institution = await Institution.findOne();
    if (!institution) {
      institution = await Institution.create({
        name: "Tamper Test University",
        officialEmailDomain: "tamper.edu",
        address: "Campus 1",
        website: "https://tamper.edu",
        authorizedIssuers: ["admin@tamper.edu"],
      });
    }

    const uint8Pdf = await generateCertificatePdf({
      certificateId: testCertId,
      studentName: "Benjamin Miller",
      institutionName: institution.name,
      degree: "Bachelor of Science in Cybersecurity",
      department: "Information Security",
      graduationYear: 2026,
      issueDate: new Date("2026-06-01"),
      certificateType: "Bachelor of Science",
    });

    originalPdfBuffer = Buffer.from(uint8Pdf);
    originalHash = calculatePdfSha256(originalPdfBuffer);
    const storagePath = await storageService.savePdf(testCertId, originalPdfBuffer);

    await Certificate.create({
      certificateId: testCertId,
      studentName: "Benjamin Miller",
      studentId: "ENR-6655",
      studentEmail: "ben@tamper.edu",
      institutionId: institution._id,
      degree: "Bachelor of Science in Cybersecurity",
      department: "Information Security",
      academicYear: "2022-2026",
      graduationYear: 2026,
      issueDate: new Date("2026-06-01"),
      certificateType: "Bachelor of Science",

      pdfStoragePath: storagePath,
      pdfSha256: originalHash.hexSha256,
      blockchainHash: originalHash.bytes32,

      blockchainStatus: "confirmed",
      certificateStatus: "active",
      isDemoRecord: false,
      networkType: "hardhat",
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("Should verify original, untouched PDF file as VALID", async () => {
    const res = await request(app)
      .post("/api/verify/pdf")
      .attach("certificatePdf", originalPdfBuffer, "certificate.pdf");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.certificateId).toBe(testCertId);
    expect(res.body.data.isHashMatch).toBe(true);
    expect(res.body.comparison.matches).toBe(true);
    expect(res.body.comparison.uploadedPdfSha256).toBe(originalHash.hexSha256);
  });

  it("CRITICAL: Should detect 1-byte file modification and flag as INVALID_TAMPERED", async () => {
    // Clone buffer and modify exactly 1 byte
    const mutatedBuffer = Buffer.from(originalPdfBuffer);
    const mutationOffset = 100;
    mutatedBuffer[mutationOffset] = mutatedBuffer[mutationOffset] ^ 0xff; // Invert bits

    const mutatedHash = calculatePdfSha256(mutatedBuffer);
    expect(mutatedHash.hexSha256).not.toBe(originalHash.hexSha256);

    const res = await request(app)
      .post("/api/verify/pdf")
      .field("certificateId", testCertId)
      .attach("certificatePdf", mutatedBuffer, "certificate_modified.pdf");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.verificationResult).toBe("INVALID_TAMPERED");
    expect(res.body.comparison.matches).toBe(false);
    expect(res.body.comparison.uploadedPdfSha256).toBe(mutatedHash.hexSha256);
    expect(res.body.comparison.registeredPdfSha256).toBe(originalHash.hexSha256);
    expect(res.body.data.isHashMatch).toBe(false);
  });

  it("Should return NOT_FOUND when verifying an unissued PDF document", async () => {
    const unknownBuffer = Buffer.from("%PDF-1.4\n%Unissued dummy content\n%%EOF");
    const res = await request(app)
      .post("/api/verify/pdf")
      .attach("certificatePdf", unknownBuffer, "unknown.pdf");

    expect(res.status).toBe(404);
    expect(res.body.verificationResult).toBe("NOT_FOUND");
  });
});
