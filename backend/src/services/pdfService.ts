import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { generateQrPngBuffer, getVerificationUrl } from "./qrService";

export interface CertificatePdfData {
  certificateId: string;
  studentName: string;
  institutionName: string;
  degree: string;
  department: string;
  specialization?: string;
  graduationYear: number;
  issueDate: Date;
  certificateType?: string;
}

/**
 * Generates an official, printable academic certificate PDF with embedded QR code.
 */
export async function generateCertificatePdf(data: CertificatePdfData): Promise<Uint8Array> {
  // A4 Landscape: 841.89 x 595.28
  const width = 841.89;
  const height = 595.28;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, height]);

  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Palette
  const navy = rgb(23 / 255, 43 / 255, 77 / 255);       // #172B4D
  const primaryBlue = rgb(37 / 255, 99 / 255, 235 / 255); // #2563EB
  const slate = rgb(100 / 255, 116 / 255, 139 / 255);    // #64748B
  const subtleBorder = rgb(226 / 255, 232 / 255, 240 / 255); // #E2E8F0

  // 1. Draw elegant outer and inner borders
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderWidth: 2,
    borderColor: primaryBlue,
    color: rgb(1, 1, 1),
  });

  page.drawRectangle({
    x: 32,
    y: 32,
    width: width - 64,
    height: height - 64,
    borderWidth: 1,
    borderColor: subtleBorder,
  });

  // Corner decorative marks
  const cornerSize = 16;
  const drawCorner = (cx: number, cy: number, dx: number, dy: number) => {
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx + dx * cornerSize, y: cy },
      thickness: 1.5,
      color: navy,
    });
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx, y: cy + dy * cornerSize },
      thickness: 1.5,
      color: navy,
    });
  };

  drawCorner(36, 36, 1, 1);
  drawCorner(width - 36, 36, -1, 1);
  drawCorner(36, height - 36, 1, -1);
  drawCorner(width - 36, height - 36, -1, -1);

  // 2. Institution Name & Header
  const institutionUpper = data.institutionName.toUpperCase();
  const instWidth = helveticaBold.widthOfTextAtSize(institutionUpper, 20);
  page.drawText(institutionUpper, {
    x: (width - instWidth) / 2,
    y: height - 76,
    size: 20,
    font: helveticaBold,
    color: navy,
  });

  const subHeader = "OFFICIAL ACADEMIC CREDENTIAL";
  const subWidth = helvetica.widthOfTextAtSize(subHeader, 10);
  page.drawText(subHeader, {
    x: (width - subWidth) / 2,
    y: height - 94,
    size: 10,
    font: helvetica,
    color: primaryBlue,
  });

  // Divider line
  page.drawLine({
    start: { x: width / 2 - 120, y: height - 106 },
    end: { x: width / 2 + 120, y: height - 106 },
    thickness: 1,
    color: subtleBorder,
  });

  // 3. "This is to certify that"
  const certifyText = "This is to certify that";
  const certifyWidth = timesRomanItalic.widthOfTextAtSize(certifyText, 14);
  page.drawText(certifyText, {
    x: (width - certifyWidth) / 2,
    y: height - 146,
    size: 14,
    font: timesRomanItalic,
    color: slate,
  });

  // 4. Student Name
  const studentWidth = timesRomanBold.widthOfTextAtSize(data.studentName, 26);
  page.drawText(data.studentName, {
    x: (width - studentWidth) / 2,
    y: height - 186,
    size: 26,
    font: timesRomanBold,
    color: navy,
  });

  // Decorative underline under name
  page.drawLine({
    start: { x: (width - Math.max(studentWidth + 40, 200)) / 2, y: height - 196 },
    end: { x: (width + Math.max(studentWidth + 40, 200)) / 2, y: height - 196 },
    thickness: 1,
    color: primaryBlue,
  });

  // 5. Degree Award text
  const awardText = "has satisfactorily fulfilled all prescribed requirements and is hereby conferred the degree of";
  const awardWidth = timesRoman.widthOfTextAtSize(awardText, 13);
  page.drawText(awardText, {
    x: (width - awardWidth) / 2,
    y: height - 230,
    size: 13,
    font: timesRoman,
    color: slate,
  });

  // Degree title
  const degreeText = data.degree + (data.specialization ? ` with Specialization in ${data.specialization}` : "");
  const degreeWidth = timesRomanBold.widthOfTextAtSize(degreeText, 20);
  page.drawText(degreeText, {
    x: (width - degreeWidth) / 2,
    y: height - 264,
    size: 20,
    font: timesRomanBold,
    color: navy,
  });

  // Department
  const deptText = `Department of ${data.department}`;
  const deptWidth = timesRomanItalic.widthOfTextAtSize(deptText, 14);
  page.drawText(deptText, {
    x: (width - deptWidth) / 2,
    y: height - 294,
    size: 14,
    font: timesRomanItalic,
    color: slate,
  });

  // Graduation Year & Issue Date
  const dateFormatted = new Date(data.issueDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const metadataText = `Class of ${data.graduationYear}  •  Conferred on ${dateFormatted}`;
  const metaWidth = helvetica.widthOfTextAtSize(metadataText, 11);
  page.drawText(metadataText, {
    x: (width - metaWidth) / 2,
    y: height - 330,
    size: 11,
    font: helvetica,
    color: slate,
  });

  // 6. Signatures placeholder block
  // Left: University Registrar / Dean
  page.drawLine({
    start: { x: 90, y: 120 },
    end: { x: 260, y: 120 },
    thickness: 1,
    color: subtleBorder,
  });
  page.drawText("Authorized Institutional Signatory", {
    x: 90,
    y: 104,
    size: 9,
    font: helvetica,
    color: slate,
  });
  page.drawText(data.institutionName, {
    x: 90,
    y: 90,
    size: 8,
    font: helvetica,
    color: slate,
  });

  // 7. Embed QR Code & Verification Block (Right)
  const qrBuffer = await generateQrPngBuffer(data.certificateId);
  const qrImage = await pdfDoc.embedPng(qrBuffer);
  const qrSize = 84;
  const qrX = width - 180;
  const qrY = 70;

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  page.drawText("Scan to Verify on Chain", {
    x: qrX,
    y: qrY - 12,
    size: 7.5,
    font: helveticaBold,
    color: navy,
  });

  // 8. Certificate ID & Verification URL
  page.drawText(`Certificate ID: ${data.certificateId}`, {
    x: 90,
    y: 60,
    size: 9,
    font: helveticaBold,
    color: navy,
  });

  const verifyUrl = getVerificationUrl(data.certificateId);
  page.drawText(`Verification URL: ${verifyUrl}`, {
    x: 90,
    y: 46,
    size: 8,
    font: helvetica,
    color: primaryBlue,
  });

  // Footer notice
  const footerNote = "This credential can be independently verified through DecentraCert.";
  page.drawText(footerNote, {
    x: 90,
    y: 34,
    size: 7.5,
    font: helvetica,
    color: slate,
  });

  return pdfDoc.save();
}
