import { Router } from "express";
import { runIntegrityTest } from "../controllers/integrityTestController";
import { authenticate, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Closed to Admin and Issuer only — Students cannot execute laboratory byte tampering tests
router.post("/execute", authenticate, requireRole("admin", "issuer"), runIntegrityTest);

export default router;
