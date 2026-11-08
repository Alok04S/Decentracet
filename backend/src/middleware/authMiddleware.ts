import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IUser, UserRole } from "../models/User";
import { ENV } from "../config/env";
import { storageRepository } from "../services/storageRepository";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Missing or malformed authorization token.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; email: string; role: string };
    const user = (await storageRepository.findUserById(decoded.id)) || (await storageRepository.findUserByEmail(decoded.email));

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User session is invalid or user no longer exists.",
      });
      return;
    }

    req.user = user as IUser;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired authorization token.",
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized: Please log in." });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(", ")}]. Current role: '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
}
