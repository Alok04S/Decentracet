import { Router } from "express";
import {
  getDashboardStats,
  getRecentCertificates,
  getRecentVerifications,
} from "../controllers/dashboardController";
import { authenticate, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Closed to Admin and Issuer only — Students cannot view institutional metric aggregates or other student activities
router.get("/stats", authenticate, requireRole("admin", "issuer"), getDashboardStats);
router.get("/recent-certificates", authenticate, requireRole("admin", "issuer"), getRecentCertificates);
router.get("/recent-verifications", authenticate, requireRole("admin", "issuer"), getRecentVerifications);

export default router;
