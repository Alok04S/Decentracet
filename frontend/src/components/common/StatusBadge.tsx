import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldAlert } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  type?: "certificate" | "blockchain" | "verification";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = "certificate" }) => {
  const normalized = status.toLowerCase();

  // Certificate Status
  if (type === "certificate") {
    if (normalized === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-success-surface text-success border border-success-border">
          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          Active
        </span>
      );
    }
    if (normalized === "revoked") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-error-surface text-error border border-error-border">
          <XCircle className="w-3.5 h-3.5 text-error" />
          Revoked
        </span>
      );
    }
  }

  // Blockchain Status
  if (type === "blockchain") {
    if (normalized === "confirmed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary-surface text-primary border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          On-Chain Confirmed
        </span>
      );
    }
    if (normalized === "submitting" || normalized === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-warning-surface text-warning border border-warning-border">
          <Clock className="w-3.5 h-3.5 text-warning" />
          Mempool Pending
        </span>
      );
    }
    if (normalized === "failed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-error-surface text-error border border-error-border">
          <AlertTriangle className="w-3.5 h-3.5 text-error" />
          Transaction Failed
        </span>
      );
    }
    if (normalized === "unconfigured") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          Unanchored Demo
        </span>
      );
    }
  }

  // Verification Outcomes
  if (normalized === "valid") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        VALID / AUTHENTIC
      </span>
    );
  }
  if (normalized === "invalid_tampered") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200">
        <XCircle className="w-4 h-4 text-red-600" />
        INVALID / TAMPERED
      </span>
    );
  }
  if (normalized === "revoked") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        REVOKED
      </span>
    );
  }
  if (normalized === "pending_or_unavailable") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <Clock className="w-4 h-4 text-blue-600" />
        PENDING / UNAVAILABLE
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {status}
    </span>
  );
};
