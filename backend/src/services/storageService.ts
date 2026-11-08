import fs from "fs";
import path from "path";
import { ENV } from "../config/env";

export class StorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), ENV.STORAGE_DIR);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private sanitizeFilename(certificateId: string): string {
    const baseClean = path.basename(certificateId.replace(/[\0\r\n]/g, ""));
    return baseClean.replace(/[^a-zA-Z0-9-_]/g, "_") + ".pdf";
  }

  public getFilePath(certificateId: string): string {
    const filename = this.sanitizeFilename(certificateId);
    const resolvedPath = path.resolve(this.baseDir, filename);
    if (!resolvedPath.startsWith(this.baseDir)) {
      throw new Error("Security Violation: Path traversal attempt detected.");
    }
    return resolvedPath;
  }

  public async savePdf(certificateId: string, pdfBuffer: Buffer | Uint8Array): Promise<string> {
    const filePath = this.getFilePath(certificateId);
    await fs.promises.writeFile(filePath, Buffer.from(pdfBuffer));
    return filePath;
  }

  public async readPdf(certificateId: string): Promise<Buffer | null> {
    const filePath = this.getFilePath(certificateId);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.promises.readFile(filePath);
  }

  public async deletePdf(certificateId: string): Promise<boolean> {
    const filePath = this.getFilePath(certificateId);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }
}

export const storageService = new StorageService();
