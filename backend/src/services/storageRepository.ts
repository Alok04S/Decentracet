import fs from "fs";
import path from "path";
import { isDatabaseConnected } from "../config/database";
import { User, IUser } from "../models/User";
import { Institution, IInstitution } from "../models/Institution";
import { Certificate, ICertificate } from "../models/Certificate";
import { VerificationLog } from "../models/VerificationLog";
import { AuditLog } from "../models/AuditLog";

export interface QueryOptions {
  search?: string;
  status?: string;
  blockchainStatus?: string;
  degree?: string;
  department?: string;
  certificateType?: string;
  studentEmail?: string;
  studentId?: string;
  page?: number;
  limit?: number;
}

export class StorageRepository {
  private baseDir: string;
  private users: any[] = [];
  private institutions: any[] = [];
  private certificates: any[] = [];
  private verificationLogs: any[] = [];
  private auditLogs: any[] = [];
  private initialized = false;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), "storage/data");
    this.ensureDirectory();
    this.loadFromDisk();
  }

  private ensureDirectory() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private loadFromDisk() {
    try {
      const readJson = (filename: string, fallback: any[]) => {
        const filePath = path.join(this.baseDir, filename);
        if (fs.existsSync(filePath)) {
          return JSON.parse(fs.readFileSync(filePath, "utf8"));
        }
        return fallback;
      };

      this.users = readJson("users.json", []);
      this.institutions = readJson("institutions.json", []);
      this.certificates = readJson("certificates.json", []);
      this.verificationLogs = readJson("verificationLogs.json", []);
      this.auditLogs = readJson("auditLogs.json", []);
      this.initialized = true;
    } catch (err) {
      console.warn("⚠️ StorageRepository disk load warning:", err);
    }
  }

  public reloadFromDisk() {
    this.loadFromDisk();
  }

  public saveToDisk() {
    try {
      this.ensureDirectory();
      fs.writeFileSync(path.join(this.baseDir, "users.json"), JSON.stringify(this.users, null, 2), "utf8");
      fs.writeFileSync(path.join(this.baseDir, "institutions.json"), JSON.stringify(this.institutions, null, 2), "utf8");
      fs.writeFileSync(path.join(this.baseDir, "certificates.json"), JSON.stringify(this.certificates, null, 2), "utf8");
      fs.writeFileSync(path.join(this.baseDir, "verificationLogs.json"), JSON.stringify(this.verificationLogs, null, 2), "utf8");
      fs.writeFileSync(path.join(this.baseDir, "auditLogs.json"), JSON.stringify(this.auditLogs, null, 2), "utf8");
    } catch (err) {
      console.warn("⚠️ StorageRepository disk save warning:", err);
    }
  }

  // --- INSTITUTION ---
  public async getInstitution(): Promise<any> {
    if (isDatabaseConnected) {
      try {
        const doc = await Institution.findOne();
        if (doc) return doc;
      } catch {}
    }
    if (this.institutions.length > 0) return this.institutions[0];
    return {
      _id: "inst_default_01",
      name: "DecentraCert University of Technology",
      officialEmailDomain: "decentracert.edu",
      address: "742 Blockchain Way, Academic Quarter",
      website: "https://decentracert.edu",
      authorizedIssuers: ["admin@decentracert.edu"],
    };
  }

  public async setInstitution(data: any): Promise<any> {
    if (isDatabaseConnected) {
      try {
        await Institution.deleteMany({});
        await Institution.create(data);
      } catch {}
    }
    this.institutions = [data];
    this.saveToDisk();
    return data;
  }

  // --- USERS ---
  public async findUserByEmail(email: string): Promise<any | null> {
    if (this.users.length === 0) {
      this.loadFromDisk();
    }
    const clean = email.toLowerCase().trim();
    if (isDatabaseConnected) {
      try {
        const doc = await User.findOne({ email: clean });
        if (doc) return doc;
      } catch {}
    }
    return this.users.find((u) => u.email.toLowerCase() === clean) || null;
  }

  public async findUserById(id: string): Promise<any | null> {
    if (isDatabaseConnected) {
      try {
        const doc = await User.findById(id);
        if (doc) return doc;
      } catch {}
    }
    return this.users.find((u) => String(u._id || u.id) === String(id)) || null;
  }

  public async addUser(userData: any): Promise<any> {
    const userWithId = {
      _id: userData._id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isDatabaseConnected) {
      try {
        await User.create(userWithId);
      } catch {}
    }

    this.users.push(userWithId);
    this.saveToDisk();
    return userWithId;
  }

  public async setAllUsers(userList: any[]): Promise<void> {
    this.users = userList;
    this.saveToDisk();
    if (isDatabaseConnected) {
      try {
        await User.deleteMany({});
        await User.insertMany(userList);
      } catch {}
    }
  }

  public getAllUsers(): any[] {
    return this.users;
  }

  // --- CERTIFICATES ---
  public async findCertificateById(id: string): Promise<any | null> {
    if (this.certificates.length === 0) {
      this.loadFromDisk();
    }
    const clean = id.trim().toUpperCase();
    if (isDatabaseConnected) {
      try {
        const doc = await Certificate.findOne({ certificateId: clean }).populate("institutionId");
        if (doc) return doc;
      } catch {}
    }
    return this.certificates.find((c) => c.certificateId.toUpperCase() === clean) || null;
  }

  public async findCertificateByHash(hash: string): Promise<any | null> {
    const clean = hash.trim().toLowerCase();
    if (isDatabaseConnected) {
      try {
        const doc = await Certificate.findOne({
          $or: [{ pdfSha256: clean }, { blockchainHash: clean }],
        });
        if (doc) return doc;
      } catch {}
    }
    return (
      this.certificates.find(
        (c) => c.pdfSha256.toLowerCase() === clean || c.blockchainHash.toLowerCase() === clean
      ) || null
    );
  }

  public async addCertificate(certData: any): Promise<any> {
    const certWithId = {
      _id: certData._id || `cert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...certData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isDatabaseConnected) {
      try {
        await Certificate.create(certWithId);
      } catch {}
    }

    this.certificates.unshift(certWithId);
    this.saveToDisk();
    return certWithId;
  }

  public async updateCertificate(id: string, updates: Partial<any>): Promise<any | null> {
    const clean = id.trim().toUpperCase();
    let updated = null;

    const idx = this.certificates.findIndex((c) => c.certificateId.toUpperCase() === clean);
    if (idx !== -1) {
      this.certificates[idx] = { ...this.certificates[idx], ...updates, updatedAt: new Date().toISOString() };
      updated = this.certificates[idx];
      this.saveToDisk();
    }

    if (isDatabaseConnected) {
      try {
        const doc = await Certificate.findOneAndUpdate({ certificateId: clean }, updates, { new: true });
        if (doc) updated = doc;
      } catch {}
    }

    return updated;
  }

  public async setAllCertificates(certList: any[]): Promise<void> {
    this.certificates = certList;
    this.saveToDisk();
    if (isDatabaseConnected) {
      try {
        await Certificate.deleteMany({});
        await Certificate.insertMany(certList);
      } catch {}
    }
  }

  public queryCertificates(options: QueryOptions = {}): { data: any[]; total: number; page: number; totalPages: number } {
    if (this.certificates.length === 0) {
      this.loadFromDisk();
    }
    let list = [...this.certificates];

    if (options.studentEmail) {
      const email = options.studentEmail.toLowerCase();
      list = list.filter((c) => c.studentEmail?.toLowerCase() === email);
    }

    if (options.studentId) {
      const sid = options.studentId.toLowerCase();
      list = list.filter((c) => c.studentId?.toLowerCase() === sid);
    }

    if (options.status) {
      list = list.filter((c) => c.certificateStatus === options.status);
    }

    if (options.blockchainStatus) {
      list = list.filter((c) => c.blockchainStatus === options.blockchainStatus);
    }

    if (options.degree) {
      const deg = options.degree.toLowerCase();
      list = list.filter((c) => c.degree?.toLowerCase().includes(deg));
    }

    if (options.department) {
      const dept = options.department.toLowerCase();
      list = list.filter((c) => c.department?.toLowerCase().includes(dept));
    }

    if (options.certificateType) {
      const ct = options.certificateType.toLowerCase();
      list = list.filter((c) => c.certificateType?.toLowerCase().includes(ct));
    }

    if (options.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.studentName?.toLowerCase().includes(q) ||
          c.certificateId?.toLowerCase().includes(q) ||
          c.studentId?.toLowerCase().includes(q) ||
          c.degree?.toLowerCase().includes(q) ||
          c.department?.toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const paginated = list.slice(skip, skip + limit);

    return {
      data: paginated,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  // --- STATS & METRICS ---
  public getStats(): {
    totalCertificates: number;
    activeCertificates: number;
    revokedCertificates: number;
    verificationRequests: number;
    successfulVerifications: number;
    successRatePercentage: number;
  } {
    if (this.certificates.length === 0) {
      this.loadFromDisk();
    }
    const totalCertificates = this.certificates.length;
    const activeCertificates = this.certificates.filter((c) => c.certificateStatus === "active").length;
    const revokedCertificates = this.certificates.filter((c) => c.certificateStatus === "revoked").length;
    const verificationRequests = this.verificationLogs.length;
    const successfulVerifications = this.verificationLogs.filter((v) => v.verificationResult === "VALID").length;
    const successRatePercentage =
      verificationRequests > 0 ? Math.round((successfulVerifications / verificationRequests) * 100) : 100;

    return {
      totalCertificates,
      activeCertificates,
      revokedCertificates,
      verificationRequests,
      successfulVerifications,
      successRatePercentage,
    };
  }

  // --- VERIFICATION LOGS ---
  public addVerificationLog(log: any) {
    const entry = {
      _id: `vlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...log,
      verifiedAt: log.verifiedAt || new Date().toISOString(),
    };
    this.verificationLogs.unshift(entry);
    if (this.verificationLogs.length > 500) {
      this.verificationLogs = this.verificationLogs.slice(0, 500);
    }
    this.saveToDisk();

    if (isDatabaseConnected) {
      try {
        VerificationLog.create(entry);
      } catch {}
    }
    return entry;
  }

  public getRecentVerifications(limit = 6): any[] {
    return this.verificationLogs.slice(0, limit);
  }

  // --- AUDIT LOGS ---
  public addAuditLog(log: any) {
    const entry = {
      _id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...log,
      timestamp: log.timestamp || new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(0, 500);
    }
    this.saveToDisk();

    if (isDatabaseConnected) {
      try {
        AuditLog.create(entry);
      } catch {}
    }
    return entry;
  }

  public getAuditLogs(page = 1, limit = 20): { data: any[]; total: number; totalPages: number } {
    const total = this.auditLogs.length;
    const skip = (page - 1) * limit;
    return {
      data: this.auditLogs.slice(skip, skip + limit),
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}

export const storageRepository = new StorageRepository();
