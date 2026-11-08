import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase, isDatabaseConnected } from "../config/database";
import { generateCertificatePdf } from "../services/pdfService";
import { calculatePdfSha256 } from "../services/hashService";
import { storageService } from "../services/storageService";
import { storageRepository } from "../services/storageRepository";
import { User } from "../models/User";
import { Institution } from "../models/Institution";
import { Certificate } from "../models/Certificate";
import { VerificationLog } from "../models/VerificationLog";
import { AuditLog } from "../models/AuditLog";

const DEPARTMENTS = [
  {
    name: "Computer Science & Software Systems",
    degrees: ["Bachelor of Science in Computer Science", "Master of Science in Software Engineering"],
    specializations: ["Distributed Systems & Cloud Architecture", "High-Performance Computing", "Compiler Design"],
  },
  {
    name: "Artificial Intelligence & Robotics",
    degrees: ["Bachelor of Science in Artificial Intelligence", "Master of Science in Autonomous Systems"],
    specializations: ["Deep Learning & Neural Architectures", "Computer Vision & SLAM", "Reinforcement Learning"],
  },
  {
    name: "Cybersecurity & Cryptographic Engineering",
    degrees: ["Bachelor of Science in Cybersecurity", "Master of Science in Information Assurance"],
    specializations: ["Applied Cryptography & ZK Proofs", "Network Penetration & Defense", "Smart Contract Security"],
  },
  {
    name: "Data Science & Big Data Analytics",
    degrees: ["Bachelor of Science in Data Science", "Master of Science in Applied Predictive Analytics"],
    specializations: ["Statistical Machine Learning", "Massive Data Pipelines", "Quantitative Optimization"],
  },
  {
    name: "Electrical & Computer Engineering",
    degrees: ["Bachelor of Science in Computer Engineering", "Master of Science in Embedded Electronics"],
    specializations: ["VLSI Design & Hardware Security", "FPGA Acceleration", "IoT Edge Architectures"],
  },
  {
    name: "Biotechnology & Genomic Sciences",
    degrees: ["Bachelor of Science in Bioinformatics", "Master of Science in Computational Genomics"],
    specializations: ["Precision Gene Sequencing", "Computational Proteomics", "Biochemical Systems"],
  },
  {
    name: "Business Informatics & Quantitative Finance",
    degrees: ["Bachelor of Science in Financial Engineering", "Master of Science in Fintech Informatics"],
    specializations: ["Algorithmic Trading Protocols", "Decentralized Finance (DeFi)", "Corporate Risk Analysis"],
  },
  {
    name: "Mechanical & Autonomous Systems",
    degrees: ["Bachelor of Science in Robotics Engineering", "Master of Science in Mechatronics"],
    specializations: ["Autonomous Vehicle Telemetry", "Drone Flight Dynamics", "Kinematic Optimization"],
  },
  {
    name: "Quantum Computing & Applied Physics",
    degrees: ["Bachelor of Science in Quantum Engineering", "Master of Science in Applied Quantum Physics"],
    specializations: ["Quantum Cryptography (QKD)", "Superconducting Qubits", "Quantum Algorithms"],
  },
  {
    name: "Information Systems & Cloud Architectures",
    degrees: ["Bachelor of Science in Information Systems", "Master of Science in Cloud Infrastructure"],
    specializations: ["Kubernetes & Multi-Cloud Ops", "Enterprise Systems Architecture", "Microservices Governance"],
  },
];

const FIRST_NAMES = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth",
  "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
  "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra",
  "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
  "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah",
  "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon", "Jeffrey", "Laura", "Ryan", "Cynthia",
  "Jacob", "Kathleen", "Gary", "Amy", "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen",
  "Stephen", "Anna", "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Emma",
  "Benjamin", "Samantha", "Samuel", "Katherine", "Gregory", "Christine", "Frank", "Debra", "Alexander", "Rachel",
  "Raymond", "Catherine", "Patrick", "Carolyn", "Jack", "Janet", "Dennis", "Ruth", "Jerry", "Maria"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
  "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes",
  "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper",
  "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
  "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Mendoza", "Gray", "Hughes", "Price",
  "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez", "Powell"
];

const REVOCATION_REASONS = [
  "Academic Senate Disciplinary Ruling: Retroactive invalidation due to academic dishonesty in senior capstone research.",
  "University Registrar Administrative Action: Duplicate credential record superseded by official replacement.",
  "Academic Prerequisites Audit: Failure to fulfill minimum 300-level quantum laboratory requirements prior to degree conferral.",
  "Disciplinary Board Resolution 2025-08: Credential officially revoked due to unauthorized grade alterations in student record.",
  "Institutional Compliance Notice: Candidate failed to submit final certified thesis repository code by deadline.",
];

export async function generateFullDemoDataset() {
  console.log("===============================================================");
  console.log("  DecentraCert Enterprise Dataset Generator");
  console.log("  Generating 100 Verified Students & 800 Digitally Hashed Credentials");
  console.log("===============================================================");

  // Attempt database connection
  await connectDatabase();

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash("Student@123", salt);
  const adminPasswordHash = await bcrypt.hash("Admin@123", salt);
  const issuerPasswordHash = await bcrypt.hash("Issuer@123", salt);

  // 1. Institution
  const institution = {
    _id: "inst_decentracert_univ",
    name: "DecentraCert University of Technology",
    officialEmailDomain: "decentracert.edu",
    address: "742 Blockchain Way, Academic Quarter, Cambridge, MA",
    website: "https://decentracert.edu",
    authorizedIssuers: ["admin@decentracert.edu", "issuer@decentracert.edu"],
    createdAt: new Date("2024-01-01T00:00:00.000Z").toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await storageRepository.setInstitution(institution);

  // 2. Administrators & Issuers
  const users: any[] = [
    {
      _id: "user_admin_01",
      name: "Dr. Eleanor Vance (Dean & Chief Registrar)",
      email: "admin@decentracert.edu",
      passwordHash: adminPasswordHash,
      role: "admin",
      institutionId: institution._id,
      createdAt: new Date("2024-01-01").toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "user_issuer_01",
      name: "Marcus Aurelius Thorne (Academic Verifier)",
      email: "issuer@decentracert.edu",
      passwordHash: issuerPasswordHash,
      role: "issuer",
      institutionId: institution._id,
      createdAt: new Date("2024-01-01").toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // 3. 100 Students
  const studentsList: any[] = [];
  for (let i = 1; i <= 100; i++) {
    const padIndex = String(i).padStart(3, "0");
    const firstName = FIRST_NAMES[i - 1];
    const lastName = LAST_NAMES[i - 1];
    const studentName = `${firstName} ${lastName}`;
    const studentEmail = `student${padIndex}@decentracert.edu`;
    const studentId = `DC-STU-2022-${padIndex}`;
    const deptObj = DEPARTMENTS[(i - 1) % DEPARTMENTS.length];

    const studentUser = {
      _id: `user_stu_${padIndex}`,
      name: studentName,
      email: studentEmail,
      passwordHash: defaultPasswordHash,
      role: "student",
      studentId: studentId,
      institutionId: institution._id,
      department: deptObj.name,
      createdAt: new Date("2022-09-01").toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(studentUser);
    studentsList.push({
      ...studentUser,
      deptObj,
    });
  }

  await storageRepository.setAllUsers(users);
  console.log(`✅ Created 1 Institution and ${users.length} Users (Admin, Issuer, and 100 Students)`);

  // 4. 800 Academic Certificates (8 per student)
  const certificates: any[] = [];
  let revokedCount = 0;

  for (let sIndex = 0; sIndex < studentsList.length; sIndex++) {
    const stu = studentsList[sIndex];
    const sNum = String(sIndex + 1).padStart(3, "0");
    const dept = stu.deptObj;

    const certTemplates = [
      {
        subId: "01",
        certificateType: "Bachelor of Science Degree",
        degree: dept.degrees[0],
        specialization: dept.specializations[0],
        grade: "Summa Cum Laude (GPA 3.94 / 4.0)",
        remarks: "Awarded with Highest Academic Distinction and University Honors",
        graduationYear: 2026,
        issueDate: "2026-05-20",
      },
      {
        subId: "02",
        certificateType: "Dean's Honor Roll",
        degree: `${dept.name} Honors Roll`,
        specialization: "Academic Excellence in Advanced Theoretical Research",
        grade: "Distinction",
        remarks: "Maintained continuous placement on the Dean's High Honor Roll for 6 consecutive academic semesters",
        graduationYear: 2025,
        issueDate: "2025-12-15",
      },
      {
        subId: "03",
        certificateType: "Concentration & Minor",
        degree: `Advanced Minor in ${dept.specializations[1]}`,
        specialization: dept.specializations[1],
        grade: "High Honors",
        remarks: "Successfully completed 24 rigorous elective credits in specialized domain",
        graduationYear: 2025,
        issueDate: "2025-11-30",
      },
      {
        subId: "04",
        certificateType: "Senior Thesis Defense",
        degree: `Distinguished Capstone: Formal Verification of Autonomous Protocols`,
        specialization: "Independent Academic Investigation",
        grade: "Grade: 98/100 (Unanimous Faculty Commendation)",
        remarks: "Published in the DecentraCert Academic Journal of Computational Science",
        graduationYear: 2026,
        issueDate: "2026-04-18",
      },
      {
        subId: "05",
        certificateType: "Industrial Practicum",
        degree: `Applied Blockchain & Distributed Systems Practicum`,
        specialization: "Enterprise Distributed Architecture",
        grade: "Outstanding (Supervised Industry Evaluation)",
        remarks: "Completed 640 hours of on-site cryptographic protocol engineering",
        graduationYear: 2025,
        issueDate: "2025-08-25",
      },
      {
        subId: "06",
        certificateType: "Professional Certification",
        degree: `Certified Cryptographic Systems Engineer (CCSE)`,
        specialization: "Zero-Knowledge Protocols & Solidity Smart Contracts",
        grade: "Certified Master Level",
        remarks: "Verified by DecentraCert Cryptographic Assessment Laboratory",
        graduationYear: 2025,
        issueDate: "2025-06-10",
      },
      {
        subId: "07",
        certificateType: "University Fellowship",
        degree: `Presidential Innovation Fellow Award`,
        specialization: "Student Leadership & Campus Web3 Governance",
        grade: "Presidential Laureate",
        remarks: "Bestowed upon top 1% of graduates demonstrating exceptional community leadership",
        graduationYear: 2026,
        issueDate: "2026-03-01",
      },
      {
        subId: "08",
        certificateType: "Academic Integrity Attestation",
        degree: `Institutional Verification of Academic Integrity`,
        specialization: "Ethics, Plagiarism Screening & Intellectual Property",
        grade: "Verified Authentic",
        remarks: "Comprehensive audit of all laboratory submissions and digital signatures verified",
        graduationYear: 2026,
        issueDate: "2026-05-01",
      },
    ];

    for (let cIndex = 0; cIndex < certTemplates.length; cIndex++) {
      const tmpl = certTemplates[cIndex];
      const certificateId = `DC-2026-STU${sNum}-${tmpl.subId}`;

      // Cryptographic SHA-256 calculation
      // Deterministic calculation based on immutable credential properties
      const digestPayload = `${certificateId}:${stu.name}:${stu.studentId}:${tmpl.degree}:${tmpl.issueDate}:${institution.name}:V1`;
      const sha256Hex = crypto.createHash("sha256").update(digestPayload).digest("hex");
      const bytes32 = `0x${sha256Hex}`;

      // Approximately 5% revocation rate (every 20th cert)
      const isRevoked = (sIndex * 8 + cIndex + 1) % 20 === 0;
      let certStatus = isRevoked ? "revoked" : "active";
      let revocationReason = isRevoked ? REVOCATION_REASONS[revokedCount % REVOCATION_REASONS.length] : undefined;
      let revokedAt = isRevoked ? new Date("2026-06-01T12:00:00.000Z").toISOString() : undefined;
      if (isRevoked) revokedCount++;

      const certDoc: any = {
        _id: `cert_stu${sNum}_${tmpl.subId}`,
        certificateId,
        studentName: stu.name,
        studentId: stu.studentId,
        studentEmail: stu.email,
        institutionId: institution._id,
        degree: tmpl.degree,
        department: dept.name,
        specialization: tmpl.specialization,
        academicYear: "2022-2026",
        graduationYear: tmpl.graduationYear,
        issueDate: new Date(tmpl.issueDate).toISOString(),
        certificateType: tmpl.certificateType,
        grade: tmpl.grade,
        remarks: tmpl.remarks,

        pdfStoragePath: `storage/certificates/${certificateId}.pdf`,
        pdfSha256: sha256Hex,
        blockchainHash: bytes32,

        blockchainStatus: "confirmed",
        certificateStatus: certStatus,
        revocationReason,
        revokedAt,
        isDemoRecord: true,
        networkType: "demo_local",
        issuerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        blockNumber: 19827300 + (sIndex * 8 + cIndex),
        transactionHash: `0x${crypto.createHash("sha256").update(certificateId + ":tx").digest("hex")}`,
        createdAt: new Date(tmpl.issueDate).toISOString(),
        updatedAt: new Date().toISOString(),
      };

      certificates.push(certDoc);
    }
  }

  // Pre-generate actual PDF files for the first 10 students (80 PDFs) so they exist physically on disk
  console.log("📄 Pre-generating physical PDF vector documents for Students 1-10...");
  for (let i = 0; i < 80; i++) {
    const c = certificates[i];
    try {
      const pdfBytes = await generateCertificatePdf({
        certificateId: c.certificateId,
        studentName: c.studentName,
        institutionName: institution.name,
        degree: c.degree,
        department: c.department,
        specialization: c.specialization,
        graduationYear: c.graduationYear,
        issueDate: new Date(c.issueDate),
        certificateType: c.certificateType,
      });

      // Recalculate exact SHA-256 from actual generated PDF buffer so byte integrity is 100% exact!
      const { hexSha256, bytes32 } = calculatePdfSha256(pdfBytes);
      c.pdfSha256 = hexSha256;
      c.blockchainHash = bytes32;

      await storageService.savePdf(c.certificateId, pdfBytes);
    } catch (pdfErr) {
      // Continue if any formatting error
    }
  }

  await storageRepository.setAllCertificates(certificates);
  console.log(`✅ Successfully provisioned ${certificates.length} total credentials (${revokedCount} revoked for testing)`);

  // 5. Generate Realistic Verification Logs
  console.log("🔍 Generating realistic verification audit trail...");
  const vLogs: any[] = [];
  for (let i = 0; i < 120; i++) {
    const cert = certificates[i % certificates.length];
    const isRevoked = cert.certificateStatus === "revoked";
    vLogs.push({
      certificateId: cert.certificateId,
      uploadedFileHash: cert.pdfSha256,
      verificationResult: isRevoked ? "REVOKED" : "VALID",
      verificationMethod: i % 2 === 0 ? "id" : "pdf_upload",
      verifiedAt: new Date(Date.now() - i * 1800000).toISOString(),
    });
  }
  // Add some NOT_FOUND attempts
  vLogs.push({
    certificateId: "DC-2026-UNKNOWN-00",
    verificationResult: "NOT_FOUND",
    verificationMethod: "id",
    verifiedAt: new Date().toISOString(),
  });
  vLogs.push({
    uploadedFileHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    verificationResult: "NOT_FOUND",
    verificationMethod: "pdf_upload",
    verifiedAt: new Date().toISOString(),
  });

  for (const vl of vLogs) {
    storageRepository.addVerificationLog(vl);
  }

  // 6. Generate Realistic Audit Logs
  console.log("📜 Generating institutional compliance audit trail...");
  storageRepository.addAuditLog({
    actorEmail: "admin@decentracert.edu",
    action: "INSTITUTION_INITIALIZATION",
    entityType: "Institution",
    entityId: institution._id,
    metadata: { name: institution.name, officialDomain: institution.officialEmailDomain },
    timestamp: new Date("2024-01-01").toISOString(),
  });
  storageRepository.addAuditLog({
    actorEmail: "admin@decentracert.edu",
    action: "BATCH_ENROLLMENT",
    entityType: "StudentDirectory",
    entityId: "BATCH-2026",
    metadata: { totalStudents: 100, academicYears: "2022-2026" },
    timestamp: new Date("2024-09-01").toISOString(),
  });
  storageRepository.addAuditLog({
    actorEmail: "issuer@decentracert.edu",
    action: "BATCH_CERTIFICATE_ISSUANCE",
    entityType: "Certificate",
    entityId: "DC-2026-ALL",
    metadata: { totalConferred: 800, faculties: 10 },
    timestamp: new Date().toISOString(),
  });

  storageRepository.saveToDisk();

  console.log("===============================================================");
  console.log("🎉 DATASET GENERATION COMPLETE!");
  console.log(`- Total Students: 100 (student001@decentracert.edu to student100@decentracert.edu)`);
  console.log(`- Password for all students: Student@123`);
  console.log(`- Admin Account: admin@decentracert.edu / Admin@123`);
  console.log(`- Issuer Account: issuer@decentracert.edu / Issuer@123`);
  console.log(`- Total Certificates: ${certificates.length} (8 per student)`);
  console.log(`- Sample Active ID: DC-2026-STU001-01`);
  console.log(`- Sample Revoked ID: ${certificates.find((c) => c.certificateStatus === "revoked")?.certificateId}`);
  console.log("===============================================================");

  if (isDatabaseConnected) {
    await disconnectDatabase();
  }
}

if (require.main === module) {
  generateFullDemoDataset()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Generator error:", err);
      process.exit(1);
    });
}
