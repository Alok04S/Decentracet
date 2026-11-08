import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ENV } from "../config/env";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { storageRepository } from "../services/storageRepository";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["student", "verifier", "admin", "issuer"]).optional().default("student"),
  studentId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

function generateToken(user: any): string {
  return jwt.sign(
    {
      id: String(user._id || user.id),
      email: user.email,
      role: user.role,
    },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN as any }
  );
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, errors: parseResult.error.flatten().fieldErrors });
      return;
    }

    const { name, email, password, role, studentId } = parseResult.data;

    // Reject privilege escalation attempts: Only students may register publicly
    if (role !== "student") {
      res.status(403).json({
        success: false,
        message:
          "Forbidden: Only student graduate accounts can be registered publicly. Administrative and issuer accounts must be provisioned by institution authority.",
      });
      return;
    }

    const existingUser = await storageRepository.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ success: false, message: "A user with this email address already exists." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await storageRepository.addUser({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "student",
      studentId: studentId?.trim(),
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        studentId: newUser.studentId,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Internal server error during registration." });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, errors: parseResult.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = parseResult.data;

    const user = await storageRepository.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }

    const institution = await storageRepository.getInstitution();
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        institution: institution ? { id: institution._id, name: institution.name } : null,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error during login." });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized." });
    return;
  }

  const institution = await storageRepository.getInstitution();

  res.json({
    success: true,
    user: {
      id: req.user._id || (req.user as any).id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      studentId: req.user.studentId,
      institution: institution ? { id: institution._id, name: institution.name } : null,
    },
  });
}
