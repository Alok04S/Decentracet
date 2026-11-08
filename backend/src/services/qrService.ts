import QRCode from "qrcode";
import { ENV } from "../config/env";

export function getVerificationUrl(certificateId: string): string {
  const baseUrl = ENV.FRONTEND_URL.replace(/\/+$/, "");
  return `${baseUrl}/verify/${encodeURIComponent(certificateId)}`;
}

/**
 * Generates a Data URL (PNG) of the QR code containing ONLY the public verification URL.
 */
export async function generateQrDataUrl(certificateId: string): Promise<string> {
  const url = getVerificationUrl(certificateId);
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 256,
    color: {
      dark: "#172B4D", // Deep Navy
      light: "#FFFFFF",
    },
  });
}

/**
 * Generates a PNG Buffer of the QR code.
 */
export async function generateQrPngBuffer(certificateId: string): Promise<Buffer> {
  const url = getVerificationUrl(certificateId);
  return QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 256,
    color: {
      dark: "#172B4D",
      light: "#FFFFFF",
    },
  });
}
