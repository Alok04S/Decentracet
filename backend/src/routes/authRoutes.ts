import { Router } from "express";
import { register, login, getMe } from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";
import { authRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.get("/me", authenticate, getMe);
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully." });
});

export default router;
