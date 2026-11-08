import { Router } from "express";
import { verifyById, verifyByPdf, downloadPublicPdf, getPublicQr } from "../controllers/verifyController";
import { verificationRateLimiter } from "../middleware/rateLimiter";
import { uploadPdf } from "../middleware/uploadMiddleware";

const router = Router();

// Rate-limited public verification endpoints
router.post("/id", verificationRateLimiter, verifyById);
router.post("/pdf", verificationRateLimiter, uploadPdf.single("certificatePdf"), verifyByPdf);

// Public PDF Document stream (Rate-limited, only valid sanitized IDs)
router.get("/:id/pdf", verificationRateLimiter, downloadPublicPdf);
router.get("/pdf/:id", verificationRateLimiter, downloadPublicPdf);

// Public QR Code image stream (Rate-limited, only valid IDs)
router.get("/:id/qr", verificationRateLimiter, getPublicQr);
router.get("/qr/:id", verificationRateLimiter, getPublicQr);

export default router;
