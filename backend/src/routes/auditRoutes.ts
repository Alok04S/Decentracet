import { Router } from "express";
import { getAuditLogs } from "../controllers/auditController";
import { authenticate, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticate, requireRole("admin"), getAuditLogs);

export default router;
