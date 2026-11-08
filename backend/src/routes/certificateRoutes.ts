import { Router } from "express";
import {
  issueCertificate,
  getCertificates,
  getCertificateById,
  downloadCertificatePdf,
  getCertificateQr,
  revokeCertificate,
  reconcileCertificate,
} from "../controllers/certificateController";
import { authenticate, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Student or Admin can view and download
router.get("/", authenticate, getCertificates);
router.get("/:id", authenticate, getCertificateById);
router.get("/:id/pdf", authenticate, downloadCertificatePdf);
router.get("/:id/qr", authenticate, getCertificateQr);

// Issuer or Admin can issue
router.post("/", authenticate, requireRole("admin", "issuer"), issueCertificate);

// Admin can revoke or reconcile
router.post("/:id/revoke", authenticate, requireRole("admin"), revokeCertificate);
router.post("/:id/reconcile", authenticate, requireRole("admin"), reconcileCertificate);

export default router;
