import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, LogIn, AlertCircle, Sparkles } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        if (res.data.user.role === "student") {
          navigate("/student/dashboard");
        } else {
          navigate("/admin/dashboard");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (role: "admin" | "student") => {
    if (role === "admin") {
      setEmail("admin@decentracert.edu");
      setPassword("Admin@DecentraCert2026!");
    } else {
      setEmail("student@decentracert.edu");
      setPassword("Student@DecentraCert2026!");
    }
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-navy">DecentraCert</span>
        </Link>
        <h2 className="text-xl font-bold text-navy">Institutional Sign In</h2>
        <p className="text-xs text-secondary mt-1">
          Access credential issuance, management and student verification dashboards.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="enterprise-card py-8 px-6 sm:px-10">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@institution.edu"
                required
                className="enterprise-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="enterprise-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="enterprise-btn-primary w-full py-2.5 text-xs font-bold gap-2 mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              Sign In to Account
            </button>
          </form>

          {/* Evaluator Quick Demo Helpers */}
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Evaluator Quick Demo Credentials
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo("admin")}
                className="enterprise-btn-secondary text-[11px] py-1.5 px-2.5 text-left flex flex-col items-start"
              >
                <span className="font-bold text-navy">University Admin</span>
                <span className="text-[10px] text-secondary font-mono truncate w-full">admin@decentracert.edu</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickDemo("student")}
                className="enterprise-btn-secondary text-[11px] py-1.5 px-2.5 text-left flex flex-col items-start"
              >
                <span className="font-bold text-navy">Student Account</span>
                <span className="text-[10px] text-secondary font-mono truncate w-full">student@decentracert.edu</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-secondary">
            <span>Don't have an account yet? </span>
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
