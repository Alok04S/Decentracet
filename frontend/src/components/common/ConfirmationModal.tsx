import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  requireReason?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => Promise<void> | void;
  onClose: () => void;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  requireReason = false,
  reasonPlaceholder = "Provide a formal reason for this action...",
  onConfirm,
  onClose,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requireReason && reason.trim().length === 0) {
      setError("A formal reason is required to proceed.");
      return;
    }
    setError("");
    await onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-xs">
      <div className="bg-surface border border-border rounded-xl shadow-elevated max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isDestructive ? "bg-red-50 text-error" : "bg-blue-50 text-primary"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy leading-snug">{title}</h3>
                <p className="text-xs text-secondary mt-0.5">{description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-secondary hover:text-navy p-1 rounded-md hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {requireReason && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-navy mb-1.5">
                Revocation Justification <span className="text-error">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError("");
                }}
                placeholder={reasonPlaceholder}
                rows={3}
                className="enterprise-input resize-none text-xs"
              />
              {error && <p className="text-xs text-error mt-1">{error}</p>}
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-border flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="enterprise-btn-secondary text-xs py-2 px-3.5"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`text-xs py-2 px-4 rounded-lg font-semibold text-white transition-colors flex items-center gap-2 ${
              isDestructive
                ? "bg-error hover:bg-red-700 disabled:opacity-50"
                : "bg-primary hover:bg-primary-hover disabled:opacity-50"
            }`}
          >
            {isLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
