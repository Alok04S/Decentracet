import rateLimit from "express-rate-limit";

/**
 * Strict rate limiting on public verification endpoints to protect against DoS or scraping.
 */
export const verificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification requests from this IP. Please try again after 15 minutes.",
  },
});

/**
 * Standard API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Request limit exceeded. Please slow down.",
  },
});

/**
 * Strict authentication rate limiter to protect against brute-force & credential stuffing
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Max 30 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});
