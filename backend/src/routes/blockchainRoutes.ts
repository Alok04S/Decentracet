import { Router } from "express";
import { getBlockchainStatus, getBlockchainTransactions } from "../controllers/blockchainController";
import { authenticate, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.get("/status", getBlockchainStatus);
// Closed to Admin and Issuer only — Students cannot browse institutional transactions
router.get("/transactions", authenticate, requireRole("admin", "issuer"), getBlockchainTransactions);

export default router;
