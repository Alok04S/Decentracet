import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  CheckCircle2,
  XCircle,
  SearchCheck,
  Percent,
  PlusCircle,
  FileCheck2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Boxes,
  Activity,
  Layers,
} from "lucide-react";
import { StatCard } from "../../components/common/StatCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { api } from "../../services/api";

export const OverviewPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentCerts, setRecentCerts] = useState<any[]>([]);
  const [recentVerifications, setRecentVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, certsRes, verifyRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/dashboard/recent-certificates"),
          api.get("/dashboard/recent-verifications"),
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data);
        }
        if (certsRes.data.success) {
          setRecentCerts(certsRes.data.data);
        }
        if (verifyRes.data.success) {
          setRecentVerifications(verifyRes.data.data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Calculating real-time database metrics..." />;
  }

  const s = stats?.stats || {
    totalCertificates: 0,
    activeCertificates: 0,
    revokedCertificates: 0,
    verificationRequests: 0,
    successfulVerifications: 0,
    successRatePercentage: 0,
  };

  const bc = stats?.blockchain || {
    connected: false,
    networkName: "Unavailable",
    chainId: null,
    contractAddress: "",
    isContractDeployed: false,
    latestBlock: null,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">University Administration Dashboard</h1>
          <p className="text-xs text-secondary mt-1">
            Real-time credential issuance, blockchain ledger anchoring, and public cryptographic verification audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/issue-certificate" className="enterprise-btn-primary text-xs flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4" />
            Issue New Certificate
          </Link>
          <Link to="/verify" target="_blank" className="enterprise-btn-secondary text-xs flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Public Verification
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards (Real MongoDB Counts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Certificates"
          value={s.totalCertificates}
          subtitle="Total issued on platform"
          icon={Award}
          badgeColor="primary"
        />
        <StatCard
          title="Active Credentials"
          value={s.activeCertificates}
          subtitle="Valid & verifiable on-chain"
          icon={CheckCircle2}
          badge={`${s.totalCertificates > 0 ? Math.round((s.activeCertificates / s.totalCertificates) * 100) : 100}% active`}
          badgeColor="success"
        />
        <StatCard
          title="Revoked Records"
          value={s.revokedCertificates}
          subtitle="Formally annulled credentials"
          icon={XCircle}
          badge={s.revokedCertificates > 0 ? `${s.revokedCertificates} revoked` : undefined}
          badgeColor="error"
        />
        <StatCard
          title="Public Verifications"
          value={s.verificationRequests}
          subtitle={`${s.successfulVerifications} authentic confirmations`}
          icon={SearchCheck}
          badge={`${s.successRatePercentage}% success`}
          badgeColor="primary"
        />
      </div>

      {/* Blockchain Network Health Card */}
      <div className="enterprise-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-navy">
              Ethereum Blockchain Ledger Status
            </span>
          </div>
          <div className="flex items-center gap-2">
            {bc.connected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Network Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Blockchain Disconnected
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 border border-border rounded-lg">
            <span className="text-secondary block mb-0.5">Configured Network</span>
            <span className="font-bold text-navy">{bc.networkName}</span>
          </div>

          <div className="p-3 bg-slate-50 border border-border rounded-lg">
            <span className="text-secondary block mb-0.5">Target Chain ID</span>
            <span className="font-mono font-bold text-navy">{bc.chainId ?? "Not connected"}</span>
          </div>

          <div className="p-3 bg-slate-50 border border-border rounded-lg">
            <span className="text-secondary block mb-0.5">Smart Contract Address</span>
            <span className="font-mono text-secondary truncate block" title={bc.contractAddress}>
              {bc.contractAddress || "Pending deployment"}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-border rounded-lg">
            <span className="text-secondary block mb-0.5">Contract Bytecode</span>
            <span className="font-semibold text-navy">
              {bc.isContractDeployed ? (
                <span className="text-success font-bold">Verified on Chain</span>
              ) : (
                <span className="text-warning font-bold">Bytecode Missing</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Recent Certificates & Recent Verification Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Certificates (2 Cols) */}
        <div className="lg:col-span-2 enterprise-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                Recent Certificate Issuance
              </h3>
            </div>
            <Link to="/admin/certificates" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentCerts.length === 0 ? (
            <div className="p-8 text-center text-secondary text-xs">
              No certificates have been issued yet. Click "Issue New Certificate" to begin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-border text-secondary">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Certificate ID</th>
                    <th className="py-2.5 px-4 font-semibold">Student Name</th>
                    <th className="py-2.5 px-4 font-semibold">Degree Program</th>
                    <th className="py-2.5 px-4 font-semibold">Issue Date</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentCerts.map((cert) => (
                    <tr key={cert._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-navy">
                        <Link to={`/admin/certificates`} className="text-primary hover:underline">
                          {cert.certificateId}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-navy">{cert.studentName}</td>
                      <td className="py-3 px-4 text-secondary truncate max-w-[180px]">{cert.degree}</td>
                      <td className="py-3 px-4 text-secondary">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={cert.certificateStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Verifications Feed (1 Col) */}
        <div className="enterprise-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                Recent Verification Activity
              </h3>
            </div>
            <Link to="/admin/verifications" className="text-xs font-semibold text-primary hover:underline">
              Logs
            </Link>
          </div>

          {recentVerifications.length === 0 ? (
            <div className="p-8 text-center text-secondary text-xs">
              No public verification requests logged yet.
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {recentVerifications.map((v) => (
                <div
                  key={v._id}
                  className="p-3 rounded-lg bg-slate-50 border border-border flex items-start justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-mono font-semibold text-navy">
                      {v.certificateId || "PDF Upload Check"}
                    </div>
                    <div className="text-[11px] text-secondary">
                      Method: <span className="capitalize">{v.verificationMethod.replace("_", " ")}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(v.verifiedAt).toLocaleTimeString()} • {new Date(v.verifiedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={v.verificationResult} type="verification" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
