import { Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.action) {
      filter.action = req.query.action;
    }
    if (req.query.entityId) {
      filter.entityId = req.query.entityId;
    }

    let logs: any[] = [];
    let total = 0;

    try {
      [logs, total] = await Promise.all([
        AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
        AuditLog.countDocuments(filter),
      ]);
    } catch {
      // Fallback to storageRepository
    }

    if (logs.length === 0 && total === 0) {
      const fileResult = (await import("../services/storageRepository")).storageRepository.getAuditLogs(page, limit);
      logs = fileResult.data;
      total = fileResult.total;
    }

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    console.error("Audit logs error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch audit logs." });
  }
}
