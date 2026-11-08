import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { app } from "../app";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { User } from "../models/User";
import { Institution } from "../models/Institution";
import { Certificate } from "../models/Certificate";
import { calculatePdfSha256, isValidBytes32 } from "../services/hashService";
import { ENV } from "../config/env";

describe("Certificate Engine & Privacy Minimization Suite", () => {
  let adminToken: string;
  let studentToken: string;
  let institutionId: string;

  beforeAll(async () => {
    await connectDatabase();
    await User.deleteMany({});
    await Institution.deleteMany({});
    await Certificate.deleteMany({});

    const inst = await Institution.create({
      name: "DecentraCert Engineering University",
      officialEmailDomain: "decentracert.edu",
      address: "100 Blockchain Ave",
      website: "https://decentracert.edu",
      authorizedIssuers: ["admin@decentracert.edu"],
    });
    institutionId = inst._id.toString();

    const passwordHash = await bcrypt.hash("AdminPass123!", 10);
    const adminUser = await User.create({
      name: "Registrar Admin",
      email: "admin@decentracert.edu",
      passwordHash,
      role: "admin",
      institutionId: inst._id,
    });

    const studentUser = await User.create({
      name: "Sam Student",
      email: "sam@student.edu",
      passwordHash,
      role: "student",
      studentId: "ENR-7788",
      institutionId: inst._id,
    });

    adminToken = jwt.sign(
      { id: adminUser._id.toString(), email: adminUser.email, role: adminUser.role },
      ENV.JWT_SECRET,
      { expiresIn: "1h" }
    );

    studentToken = jwt.sign(
      { id: studentUser._id.toString(), email: studentUser.email, role: studentUser.role },
      ENV.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("1. Exact Byte-Level Hashing & Bytes32 Interoperability", () => {
    it("Should compute accurate 64-char lowercase SHA-256 and valid 0x-prefixed bytes32", () => {
      const sampleBuffer = Buffer.from("ACADEMIC_CREDENTIAL_TEST_BUFFER_CONTENT");
      const { hexSha256, bytes32 } = calculatePdfSha256(sampleBuffer);

      expect(hexSha256).toHaveLength(64);
      expect(hexSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(bytes32).toHaveLength(66);
      expect(bytes32.startsWith("0x")).toBe(true);
      expect(isValidBytes32(bytes32)).toBe(true);
      expect(bytes32).toBe(`0x${hexSha256}`);
    });
  });

  describe("2. Certificate Issuance & Idempotency", () => {
    const idempotencyKey = "TEST-IDEMPOTENCY-KEY-001";

    it("Should issue a certificate with admin credentials", async () => {
      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentName: "Sam Student",
          studentId: "ENR-7788",
          studentEmail: "sam@student.edu",
          degree: "Bachelor of Science in Software Engineering",
          department: "Computer Science",
          academicYear: "2022-2026",
          graduationYear: 2026,
          idempotencyKey,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.certificate.certificateId).toMatch(/^DC-\d{4}-[A-Z0-9]{8}$/);
      expect(res.body.certificate.pdfSha256).toHaveLength(64);
      expect(res.body.certificate.blockchainHash).toHaveLength(66);
      expect(res.body.certificate.certificateStatus).toBe("active");
    });

    it("Should return existing record when same idempotency key is submitted (idempotency)", async () => {
      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentName: "Sam Student",
          studentId: "ENR-7788",
          studentEmail: "sam@student.edu",
          degree: "Bachelor of Science in Software Engineering",
          department: "Computer Science",
          academicYear: "2022-2026",
          graduationYear: 2026,
          idempotencyKey,
        });

      expect(res.status).toBe(200);
      expect(res.body.isDuplicate).toBe(true);
    });

    it("Should reject certificate issuance by unauthorized student", async () => {
      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          studentName: "Self Issued Student",
          studentId: "ENR-0000",
          studentEmail: "self@student.edu",
          degree: "Fake Degree",
          department: "None",
          academicYear: "2026",
          graduationYear: 2026,
        });

      expect(res.status).toBe(403);
    });
  });

  describe("3. Public Data Minimization (Privacy Guard)", () => {
    it("Should NOT expose student email, student ID, internal mongo _id, or file paths on public verification", async () => {
      const cert = await Certificate.findOne({ studentEmail: "sam@student.edu" });
      expect(cert).not.toBeNull();

      const res = await request(app).post("/api/verify/id").send({
        certificateId: cert!.certificateId,
      });

      expect(res.status).toBe(200);
      const data = res.body.data;

      // Publicly allowed fields
      expect(data.certificateId).toBe(cert!.certificateId);
      expect(data.studentName).toBe("Sam Student");
      expect(data.degree).toBe(cert!.degree);
      expect(data.pdfSha256).toBe(cert!.pdfSha256);
      expect(data.blockchainHash).toBe(cert!.blockchainHash);

      // STRICT PRIVACY EXCLUSIONS:
      expect(data.studentEmail).toBeUndefined();
      expect(data.studentId).toBeUndefined();
      expect(data._id).toBeUndefined();
      expect(data.pdfStoragePath).toBeUndefined();
      expect(data.remarks).toBeUndefined();
    });
  });

  describe("4. Revocation Lifecycle", () => {
    it("Should reject revocation without a reason", async () => {
      const cert = await Certificate.findOne({ studentEmail: "sam@student.edu" });

      const res = await request(app)
        .post(`/api/certificates/${cert!.certificateId}/revoke`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "" });

      expect(res.status).toBe(400);
    });

    it("Should revoke certificate with valid reason", async () => {
      const cert = await Certificate.findOne({ studentEmail: "sam@student.edu" });
      const revocationReason = "Credential cancelled due to curriculum non-compliance.";

      const res = await request(app)
        .post(`/api/certificates/${cert!.certificateId}/revoke`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: revocationReason });

      expect(res.status).toBe(200);
      expect(res.body.certificate.certificateStatus).toBe("revoked");
      expect(res.body.certificate.revocationReason).toBe(revocationReason);
      expect(res.body.certificate.revokedAt).toBeDefined();

      // Now public verification must report REVOKED
      const verifyRes = await request(app).post("/api/verify/id").send({
        certificateId: cert!.certificateId,
      });

      expect(verifyRes.body.data.verificationResult).toBe("REVOKED");
      expect(verifyRes.body.data.revocationStatus.isRevoked).toBe(true);
      expect(verifyRes.body.data.revocationStatus.revocationReason).toBe(revocationReason);
    });
  });
});
