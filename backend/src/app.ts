import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { ENV } from "./config/env";
import { apiRateLimiter } from "./middleware/rateLimiter";

import authRoutes from "./routes/authRoutes";
import certificateRoutes from "./routes/certificateRoutes";
import verifyRoutes from "./routes/verifyRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import blockchainRoutes from "./routes/blockchainRoutes";
import auditRoutes from "./routes/auditRoutes";
import integrityTestRoutes from "./routes/integrityTestRoutes";

export const app = express();

// Disable Express fingerprinting
app.disable("x-powered-by");

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible local media / blob previews
    crossOriginEmbedderPolicy: false,
    xPoweredBy: false,
  })
);

app.use(
  cors({
    origin: [ENV.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Global API rate limiting
app.use("/api", apiRateLimiter);

// Route Mappings
app.use("/api/auth", authRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/integrity-test", integrityTestRoutes);

// General health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "DecentraCert Backend API",
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' not found.`,
  });
});

// Central Error Handler — Zero data leakage guarantee
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const isSyntax = err.type === "entity.parse.failed" || err.name === "SyntaxError";
  const statusCode = isSyntax ? 400 : err.status || 500;
  const safeMessage = isSyntax
    ? "Malformed request syntax."
    : statusCode === 404
    ? "Resource not found."
    : statusCode === 403
    ? "Forbidden: Insufficient privileges."
    : statusCode === 401
    ? "Unauthorized."
    : "An internal server error occurred.";

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
  });
});
