import { Response } from "express";
import { blockchainClient } from "../config/blockchain";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { storageRepository } from "../services/storageRepository";

export async function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const stats = storageRepository.getStats();
    const health = await blockchainClient.getHealth();

    res.json({
      success: true,
      stats,
      blockchain: {
        connected: health.connected,
        networkName: health.networkName,
        chainId: health.chainId,
        contractAddress: health.contractAddress,
        isContractDeployed: health.isContractDeployed,
        latestBlock: health.latestBlock,
        errorMessage: health.errorMessage,
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Failed to compute dashboard metrics." });
  }
}

export async function getRecentCertificates(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const result = storageRepository.queryCertificates({ limit: 6 });
    res.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error("Recent certificates error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch recent certificates." });
  }
}

export async function getRecentVerifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const recent = storageRepository.getRecentVerifications(6);
    res.json({ success: true, data: recent });
  } catch (error: any) {
    console.error("Recent verifications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch recent verification activity." });
  }
}
