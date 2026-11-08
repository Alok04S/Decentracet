import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: "success" | "warning" | "error" | "primary";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = "primary",
}) => {
  const badgeClasses = {
    primary: "bg-blue-50 text-primary border-blue-200",
    success: "bg-green-50 text-success border-green-200",
    warning: "bg-amber-50 text-warning border-amber-200",
    error: "bg-red-50 text-error border-red-200",
  }[badgeColor];

  return (
    <div className="enterprise-card p-5 transition-shadow hover:shadow-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-border flex items-center justify-center text-primary">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-navy">{value}</div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-secondary mt-1">{subtitle}</p>}
    </div>
  );
};
