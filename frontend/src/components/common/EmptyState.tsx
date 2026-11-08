import React from "react";
import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="enterprise-card p-12 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-border flex items-center justify-center text-secondary mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-navy mb-1">{title}</h3>
      <p className="text-xs text-secondary max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="enterprise-btn-primary text-xs">
          {actionLabel}
        </button>
      )}
    </div>
  );
};
