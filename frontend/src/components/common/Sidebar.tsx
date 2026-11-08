import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Award,
  FileCheck2,
  Users,
  SearchCheck,
  ShieldBan,
  Boxes,
  ScrollText,
  Sliders,
  FlaskConical,
  LucideIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "issuer";

  const navItems: NavItem[] = [
    { label: "Overview", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Issue Certificate", to: "/admin/issue-certificate", icon: Award },
    { label: "All Certificates", to: "/admin/certificates", icon: FileCheck2 },
    { label: "Integrity Lab", to: "/admin/integrity-lab", icon: FlaskConical, badge: "Live" },
    { label: "Students", to: "/admin/students", icon: Users },
    { label: "Verification Records", to: "/admin/verifications", icon: SearchCheck },
    { label: "Revocation Management", to: "/admin/revocations", icon: ShieldBan },
    { label: "Blockchain Transactions", to: "/admin/transactions", icon: Boxes },
    { label: "Audit Logs", to: "/admin/audit-logs", icon: ScrollText },
    { label: "Settings", to: "/admin/settings", icon: Sliders },
  ];

  const studentNavItems: NavItem[] = [
    { label: "Overview", to: "/student/dashboard", icon: LayoutDashboard },
    { label: "My Credentials", to: "/student/certificates", icon: Award },
  ];

  const items = isAdmin ? navItems : studentNavItems;

  return (
    <aside className="w-64 bg-surface border-r border-border min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-secondary px-3 mb-2">
            {isAdmin ? "University Administration" : "Student Credential Portal"}
          </div>
          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-primary-surface text-primary border border-blue-200"
                        : "text-navy hover:bg-slate-50 border border-transparent"
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-primary">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-slate-50 border border-border text-[11px] text-secondary">
        <p className="font-semibold text-navy mb-0.5">Enterprise Security</p>
        <p className="text-[10px] leading-relaxed">
          Hashes anchored to Ethereum Sepolia. Exact byte comparison active.
        </p>
      </div>
    </aside>
  );
};
