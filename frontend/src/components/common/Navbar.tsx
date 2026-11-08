import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Activity, LogOut, ExternalLink, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

interface BlockchainHealth {
  connected: boolean;
  networkName: string;
  chainId: number | null;
  contractAddress: string;
  isContractDeployed: boolean;
  latestBlock: number | null;
}

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState<BlockchainHealth | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get("/blockchain/status");
        if (res.data.success) {
          setHealth(res.data.health);
        }
      } catch {
        setHealth({
          connected: false,
          networkName: "Unavailable",
          chainId: null,
          contractAddress: "",
          isContractDeployed: false,
          latestBlock: null,
        });
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface border-b border-border shadow-subtle px-4 lg:px-8 flex items-center justify-between">
      {/* Brand & Institution Identity */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-navy">DecentraCert</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-primary">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-secondary font-medium hidden sm:block">
              Trust Every Credential. Verify on Chain.
            </p>
          </div>
        </Link>

        {user?.institution && (
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-border">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="text-xs font-semibold text-navy max-w-[200px] truncate">
              {user.institution.name}
            </span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Real Network Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-border text-xs">
          <Activity className="w-3.5 h-3.5 text-secondary" />
          <div className="flex items-center gap-1.5">
            {health?.connected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="font-semibold text-navy">{health.networkName}</span>
                <span className="text-secondary text-[11px] font-mono">({health.chainId})</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="font-medium text-secondary">Blockchain Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* Public Verify Quick Link */}
        <Link
          to="/verify"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover px-2.5 py-1.5 rounded-md hover:bg-primary-surface transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Public Verification
        </Link>

        {/* User Profile / Auth State */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-border transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-semibold text-navy leading-none">{user.name}</div>
                <div className="text-[10px] text-secondary capitalize mt-0.5">{user.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-secondary" />
            </button>

            {/* Profile Menu Dropdown */}
            {profileOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-elevated py-1.5 z-50"
                onClick={() => setProfileOpen(false)}
              >
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-navy truncate">{user.name}</p>
                  <p className="text-[11px] text-secondary truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    Role: {user.role}
                  </span>
                </div>

                <Link
                  to={user.role === "student" ? "/student/dashboard" : "/admin/dashboard"}
                  className="w-full text-left px-3 py-2 text-xs text-navy hover:bg-slate-50 flex items-center gap-2"
                >
                  Dashboard Home
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs text-error hover:bg-red-50 flex items-center gap-2 border-t border-border"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="enterprise-btn-secondary text-xs py-1.5 px-3">
              Sign In
            </Link>
            <Link to="/register" className="enterprise-btn-primary text-xs py-1.5 px-3">
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
