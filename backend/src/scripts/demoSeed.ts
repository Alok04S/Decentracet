import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Institution } from "../models/Institution";
import { Certificate } from "../models/Certificate";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { generateCertificatePdf } from "../services/pdfService";
import { calculatePdfSha256 } from "../services/hashService";
import { storageService } from "../services/storageService";

async function seedDemoData() {
  console.log("==================================================");
  console.log("Seeding Development Demo Data");
  console.log("NOTICE: ALL RECORDS ARE EXPLICITLY TAGGED AS");
  console.log("DEVELOPMENT DEMO DATA — NOT REAL BLOCKCHAIN RECORDS");
  console.log("==================================================");

  await connectDatabase();

  try {
    let institution = await Institution.findOne({ officialEmailDomain: "decentracert.edu" });
    if (!institution) {
      institution = await Institution.create({
        name: "DecentraCert University of Technology",
        officialEmailDomain: "decentracert.edu",
        address: "742 Blockchain Way, Academic Quarter",
        website: "https://decentracert.edu",
        authorizedIssuers: ["admin@decentracert.edu"],
      });
    }

    // Student Account
    const studentEmail = "student@decentracert.edu";
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash("Student@DecentraCert2026!", salt);
      student = await User.create({
        name: "Alexander Hayes",
        email: studentEmail,
        passwordHash,
        role: "student",
        studentId: "ENR-2022-8921",
        institutionId: institution._id,
      });
      console.log(`✅ Demo Student created: ${student.email} (Password: Student@DecentraCert2026!)`);
    }

    // Demo Certificate 1: Active
    const certId1 = "DC-2026-DEMO0001";
    let cert1 = await Certificate.findOne({ certificateId: certId1 });
    if (!cert1) {
      const pdfBuffer1 = await generateCertificatePdf({
        certificateId: certId1,
        studentName: student.name,
        institutionName: institution.name,
        degree: "Bachelor of Science in Computer Science & Engineering",
        department: "Computer Science and Engineering",
        specialization: "Distributed Systems & Cryptography",
        graduationYear: 2026,
        issueDate: new Date("2026-05-15"),
        certificateType: "Bachelor of Science",
      });

      const hash1 = calculatePdfSha256(pdfBuffer1);
      const storagePath1 = await storageService.savePdf(certId1, pdfBuffer1);

      cert1 = await Certificate.create({
        certificateId: certId1,
        studentName: student.name,
        studentId: student.studentId,
        studentEmail: student.email,
        institutionId: institution._id,
        degree: "Bachelor of Science in Computer Science & Engineering",
        department: "Computer Science and Engineering",
        specialization: "Distributed Systems & Cryptography",
        academicYear: "2022-2026",
        graduationYear: 2026,
        issueDate: new Date("2026-05-15"),
        certificateType: "Bachelor of Science",
        grade: "First Class with Distinction (3.92 CGPA)",

        pdfStoragePath: storagePath1,
        pdfSha256: hash1.hexSha256,
        blockchainHash: hash1.bytes32,

        blockchainStatus: "unconfigured",
        certificateStatus: "active",
        isDemoRecord: true,
        networkType: "demo_local",
      });

      console.log(`✅ Demo Certificate 1 created: ${certId1} (Active, Unanchored Demo)`);
    }

    // Demo Certificate 2: Revoked
    const certId2 = "DC-2026-DEMO0002";
    let cert2 = await Certificate.findOne({ certificateId: certId2 });
    if (!cert2) {
      const pdfBuffer2 = await generateCertificatePdf({
        certificateId: certId2,
        studentName: "Lucas Vance",
        institutionName: institution.name,
        degree: "Master of Science in Information Security",
        department: "Cybersecurity & Cryptography",
        graduationYear: 2025,
        issueDate: new Date("2025-11-20"),
        certificateType: "Master of Science",
      });

      const hash2 = calculatePdfSha256(pdfBuffer2);
      const storagePath2 = await storageService.savePdf(certId2, pdfBuffer2);

      cert2 = await Certificate.create({
        certificateId: certId2,
        studentName: "Lucas Vance",
        studentId: "ENR-2023-4109",
        studentEmail: "lucas.vance@example.com",
        institutionId: institution._id,
        degree: "Master of Science in Information Security",
        department: "Cybersecurity & Cryptography",
        academicYear: "2023-2025",
        graduationYear: 2025,
        issueDate: new Date("2025-11-20"),
        certificateType: "Master of Science",

        pdfStoragePath: storagePath2,
        pdfSha256: hash2.hexSha256,
        blockchainHash: hash2.bytes32,

        blockchainStatus: "unconfigured",
        certificateStatus: "revoked",
        revokedAt: new Date("2026-01-10"),
        revocationReason: "Credential revoked following academic integrity review board decision.",
        isDemoRecord: true,
        networkType: "demo_local",
      });

      console.log(`✅ Demo Certificate 2 created: ${certId2} (Revoked Demo)`);
    }
  } catch (error) {
    console.error("❌ Demo seeding error:", error);
  } finally {
    await disconnectDatabase();
    console.log("==================================================");
  }
}

seedDemoData().catch(console.error);
