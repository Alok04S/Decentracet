import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  UploadCloud,
  FileCheck2,
  Lock,
  Cpu,
  ArrowRight,
  Award,
  CheckCircle2,
  BookOpen,
  Users,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Database,
  Eye,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const [certId, setCertId] = useState("");
  const navigate = useNavigate();

  const handleQuickVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;
    navigate(`/verify/${certId.trim().toUpperCase()}`);
  };

  const handleSampleClick = (id: string) => {
    navigate(`/verify/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-navy flex flex-col font-sans">
      {/* Top Enterprise Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-navy">DecentraCert</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-primary border border-blue-200">
                L1 Registry
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-secondary">
            <a href="#features" className="hover:text-primary transition-colors">
              Platform Features
            </a>
            <a href="#faculties" className="hover:text-primary transition-colors">
              Academic Faculties
            </a>
            <a href="#architecture" className="hover:text-primary transition-colors">
              Security Architecture
            </a>
            <Link to="/verify" className="hover:text-primary transition-colors flex items-center gap-1">
              Public Verifier
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/verify"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-navy px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              Verify ID
            </Link>
            <Link
              to="/login"
              className="enterprise-btn-secondary text-xs py-1.5 px-3"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="enterprise-btn-primary text-xs py-1.5 px-3 shadow-xs"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-border bg-gradient-to-b from-white via-white to-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Next-Generation Verifiable Academic Credentials</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy leading-[1.12]">
                Trust Every Credential. <br />
                <span className="text-primary">Verify on Chain.</span>
              </h1>

              <p className="text-base sm:text-lg text-secondary max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Empowering universities to issue digitally signed, tamper-proof academic diplomas.
                Employers and third parties can independently verify cryptographic authenticity in seconds without intermediaries.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/verify"
                  className="enterprise-btn-primary text-sm py-2.5 px-5 flex items-center gap-2 shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  Open Public Verifier
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </Link>
                <Link
                  to="/login"
                  className="enterprise-btn-secondary text-sm py-2.5 px-5 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Institutional Login
                </Link>
              </div>

              {/* Quick Evaluation Notice */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs text-secondary">
                <span className="font-semibold text-navy">Pre-loaded Demo:</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                  100 Students • 800 Credentials
                </span>
                <span>•</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Zero Antivirus Blocking
                </span>
              </div>
            </div>

            {/* Right Hero Interactive Verification Card */}
            <div className="lg:col-span-5">
              <div className="enterprise-card p-6 shadow-xl border-border bg-white relative">
                <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span className="font-bold text-sm text-navy">Instant Verification Portal</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    Live Ledger
                  </span>
                </div>

                <form onSubmit={handleQuickVerify} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Certificate Identifier (ID)
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-secondary" />
                      <input
                        type="text"
                        value={certId}
                        onChange={(e) => setCertId(e.target.value)}
                        placeholder="e.g. DC-2026-STU001-01"
                        className="enterprise-input pl-9 font-mono text-xs uppercase"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full enterprise-btn-primary text-xs py-2.5 flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Search className="w-4 h-4" />
                    Verify Authenticity Now
                  </button>
                </form>

                {/* 1-Click Evaluation Pills */}
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                    Try 1-Click Test Credentials:
                  </p>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleSampleClick("DC-2026-STU001-01")}
                      className="w-full text-left px-3 py-2 rounded-lg bg-blue-50/70 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-primary font-mono">
                          DC-2026-STU001-01
                        </div>
                        <div className="text-[10px] text-slate-600">
                          James Smith • B.S. in Computer Science
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        ACTIVE
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSampleClick("DC-2026-STU001-02")}
                      className="w-full text-left px-3 py-2 rounded-lg bg-blue-50/70 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-primary font-mono">
                          DC-2026-STU001-02
                        </div>
                        <div className="text-[10px] text-slate-600">
                          Dean's Academic Excellence Honor Roll
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        ACTIVE
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSampleClick("DC-2026-STU003-04")}
                      className="w-full text-left px-3 py-2 rounded-lg bg-red-50/70 hover:bg-red-100 border border-red-200 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-red-700 font-mono">
                          DC-2026-STU003-04
                        </div>
                        <div className="text-[10px] text-slate-600">
                          Robert Williams • Capstone Thesis
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                        REVOKED
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Link
                    to="/verify"
                    className="text-xs font-semibold text-primary hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Or upload a PDF file to test byte tamper detection
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Statistics Bar */}
      <section className="bg-white border-b border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 border-r border-slate-100 last:border-r-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-navy font-mono">800</div>
              <div className="text-xs font-semibold text-secondary mt-1">Conferred Credentials</div>
            </div>
            <div className="p-4 border-r border-slate-100 last:border-r-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-primary font-mono">100</div>
              <div className="text-xs font-semibold text-secondary mt-1">Graduates & Students</div>
            </div>
            <div className="p-4 border-r border-slate-100 last:border-r-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-navy font-mono">10</div>
              <div className="text-xs font-semibold text-secondary mt-1">Academic Faculties</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 font-mono">100%</div>
              <div className="text-xs font-semibold text-secondary mt-1">Cryptographic Proof</div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section id="features" className="py-16 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
              Cryptographic Integrity System
            </h2>
            <h3 className="text-3xl font-extrabold text-navy tracking-tight">
              Enterprise Architecture Designed for Higher Education
            </h3>
            <p className="text-sm text-secondary mt-3">
              Combines byte-level SHA-256 vector hashing, Ethereum smart contracts, and privacy-first data minimization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="enterprise-card p-6 bg-white hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-primary flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy mb-2">Exact Byte SHA-256 Hashing</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Calculates cryptographic digests directly from raw PDF byte streams. Ensures consistent 32-byte representation matching Solidity contracts.
              </p>
            </div>

            <div className="enterprise-card p-6 bg-white hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy mb-2">Zero PII Public Exposure</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Public verification endpoints strictly mask student emails, full identification numbers, and internal database records to uphold FERPA & GDPR standards.
              </p>
            </div>

            <div className="enterprise-card p-6 bg-white hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy mb-2">Avalanche Tamper Detection</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Even a single flipped bit in an altered PDF immediately produces an avalanche digest discrepancy, invalidating fraudulent credentials on-chain.
              </p>
            </div>

            <div className="enterprise-card p-6 bg-white hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy mb-2">Dual Storage Resilience</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Engineered with an in-process JSON repository alongside MongoDB support, guaranteeing 100% smooth operation without antivirus firewall interference.
              </p>
            </div>

            <div className="enterprise-card p-6 bg-white hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy mb-2">Official Senate Revocations</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Authorized registrars can execute immutable on-chain revocations with permanent audit reasons for academic dishonesty or administrative annulment.
              </p>
            </div>

            <div className="enterprise-card p-6 bg-white hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy mb-2">Realistic Diploma Parchments</h4>
              <p className="text-xs text-secondary leading-relaxed">
                View high-resolution embossed diplomas complete with university crest seals, academic officer signatures, and embedded dynamic verification QR codes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Faculties Section */}
      <section id="faculties" className="py-16 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                Academic Programs & Conferred Degrees
              </h2>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-navy">
                10 Academic Faculties Represented in Registry
              </h3>
            </div>
            <Link
              to="/login"
              className="enterprise-btn-secondary text-xs flex items-center gap-1.5 self-start"
            >
              <Users className="w-4 h-4" />
              Explore Student Directory
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              "Computer Science & Software Systems",
              "Artificial Intelligence & Robotics",
              "Cybersecurity & Cryptography",
              "Data Science & Big Data",
              "Electrical & Computer Eng.",
              "Biotechnology & Genomics",
              "Business & Quantitative Finance",
              "Mechanical & Autonomous Systems",
              "Quantum Computing & Physics",
              "Information Systems & Cloud",
            ].map((faculty, i) => (
              <div
                key={faculty}
                className="p-4 rounded-xl border border-border bg-[#F7F9FC] hover:bg-white hover:shadow-xs transition-all"
              >
                <div className="text-xs font-bold text-primary font-mono mb-1">
                  FACULTY #{String(i + 1).padStart(2, "0")}
                </div>
                <h4 className="text-xs font-bold text-navy leading-snug">{faculty}</h4>
                <p className="text-[11px] text-secondary mt-1">10 Students • 80 Credentials</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-Loaded Demo Portals */}
      <section className="py-16 bg-[#F7F9FC] border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl font-bold text-navy">
              Pre-Configured Platform Portals
            </h3>
            <p className="text-xs text-secondary mt-1">
              Select any role below to explore DecentraCert immediately with pre-provisioned credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Admin Card */}
            <div className="enterprise-card p-6 bg-white border-t-4 border-t-primary">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  University Registrar
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-primary font-bold">
                  Admin Role
                </span>
              </div>
              <h4 className="text-base font-bold text-navy">Office of the Dean & Registrar</h4>
              <p className="text-xs text-secondary mt-1 mb-4">
                Full institutional control: issue credentials, manage revocations, view directory and live audit logs.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 font-mono text-slate-700 mb-4">
                <div>Email: <strong>admin@decentracert.edu</strong></div>
                <div>Password: <strong>Admin@123</strong></div>
              </div>
              <Link to="/login" className="enterprise-btn-primary text-xs w-full text-center py-2 block">
                Sign In as Administrator
              </Link>
            </div>

            {/* Issuer Card */}
            <div className="enterprise-card p-6 bg-white border-t-4 border-t-amber-500">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Academic Verifier
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold">
                  Issuer Role
                </span>
              </div>
              <h4 className="text-base font-bold text-navy">Departmental Issuance Office</h4>
              <p className="text-xs text-secondary mt-1 mb-4">
                Issue credentials, conduct live byte integrity testing in the lab, and verify student records.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 font-mono text-slate-700 mb-4">
                <div>Email: <strong>issuer@decentracert.edu</strong></div>
                <div>Password: <strong>Issuer@123</strong></div>
              </div>
              <Link to="/login" className="enterprise-btn-secondary text-xs w-full text-center py-2 block">
                Sign In as Academic Issuer
              </Link>
            </div>

            {/* Student Card */}
            <div className="enterprise-card p-6 bg-white border-t-4 border-t-emerald-500">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Graduate & Alumni
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                  Student Role
                </span>
              </div>
              <h4 className="text-base font-bold text-navy">Student Credential Locker</h4>
              <p className="text-xs text-secondary mt-1 mb-4">
                View personal conferred degrees, view embossed diploma parchments, and share public verification links.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 font-mono text-slate-700 mb-4">
                <div>Email: <strong>student001@decentracert.edu</strong></div>
                <div>Password: <strong>Student@123</strong></div>
              </div>
              <Link to="/login" className="enterprise-btn-secondary text-xs w-full text-center py-2 block">
                Sign In as Student Graduate
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-border py-8 text-xs text-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="font-bold text-navy">DecentraCert Registry</span>
            <span>•</span>
            <span>DecentraCert University of Technology</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/verify" className="hover:text-primary transition-colors">
              Public Ledger Verifier
            </Link>
            <Link to="/login" className="hover:text-primary transition-colors">
              Sign In
            </Link>
            <a
              href="https://sepolia.etherscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              Sepolia Etherscan
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
