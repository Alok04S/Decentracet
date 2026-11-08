import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, UserPlus, AlertCircle, ShieldAlert } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "verifier">("student");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
        role,
        studentId: role === "student" ? studentId : undefined,
      });

      if (res.data.success) {
        login(res.data.token, res.data.user);
        if (role === "student") {
          navigate("/student/dashboard");
        } else {
          navigate("/verify");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
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
        <h2 className="text-xl font-bold text-navy">Create Public User Account</h2>
        <p className="text-xs text-secondary mt-1">
          Register to view personal credentials or manage verification workflows.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="enterprise-card py-8 px-6 sm:px-10">
          {/* Security Notice for Public Registration */}
          <div className="mb-5 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs text-navy">
            <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Role Security Policy:</strong> Administrative and issuing credentials cannot be self-assigned publicly.
              They must be provisioned via server CLI (`npm run seed:admin`).
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                className="enterprise-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@example.com"
                required
                className="enterprise-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    role === "student"
                      ? "border-primary bg-primary-surface text-primary"
                      : "border-border text-secondary hover:bg-slate-50"
                  }`}
                >
                  Student / Graduate
                </button>
                <button
                  type="button"
                  onClick={() => setRole("verifier")}
                  className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    role === "verifier"
                      ? "border-primary bg-primary-surface text-primary"
                      : "border-border text-secondary hover:bg-slate-50"
                  }`}
                >
                  Employer / Verifier
                </button>
              </div>
            </div>

            {role === "student" && (
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  Student Enrollment ID (Optional)
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. ENR-2022-8921"
                  className="enterprise-input font-mono uppercase"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
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
                <UserPlus className="w-4 h-4" />
              )}
              Create Account
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-secondary">
            <span>Already have an account? </span>
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
