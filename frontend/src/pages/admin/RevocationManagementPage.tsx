import React, { useState, useEffect } from "react";
import { ShieldBan, AlertTriangle, ExternalLink, Search, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";

export const RevocationManagementPage: React.FC = () => {
  const [revokedCerts, setRevokedCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRevocations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/certificates?status=revoked&limit=50");
      if (res.data.success) {
        setRevokedCerts(res.data.data);
      }
    } catch (err) {
      console.error("Fetch revocations error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevocations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Credential Revocation Registry</h1>
          <p className="text-xs text-secondary mt-1">
            Permanent, immutable record of revoked certificates anchored on the Ethereum smart contract.
          </p>
        </div>

        <button
          onClick={fetchRevocations}
          className="enterprise-btn-secondary text-xs flex items-center gap-1.5 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Registry
        </button>
      </div>

      <div className="enterprise-card overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading revocation records from database..." />
        ) : revokedCerts.length === 0 ? (
          <EmptyState
            title="No Revoked Credentials"
            description="All issued institutional credentials are currently active and valid. When a certificate is revoked, it appears here permanently with its formal reason and transaction hash."
            icon={ShieldBan}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border text-secondary">
                <tr>
                  <th className="py-3 px-4 font-semibold">Certificate ID</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Degree Program</th>
                  <th className="py-3 px-4 font-semibold">Revocation Reason</th>
                  <th className="py-3 px-4 font-semibold">Revoked At</th>
                  <th className="py-3 px-4 font-semibold text-right">Ledger Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {revokedCerts.map((cert) => (
                  <tr key={cert._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-navy">
                      <Link to={`/verify/${cert.certificateId}`} target="_blank" className="text-primary hover:underline">
                        {cert.certificateId}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-navy">{cert.studentName}</td>

                    <td className="py-3.5 px-4 text-secondary">{cert.degree}</td>

                    <td className="py-3.5 px-4 text-error font-medium max-w-xs">
                      {cert.revocationReason || "Administrative annulment"}
                    </td>

                    <td className="py-3.5 px-4 text-secondary">
                      {cert.revokedAt ? new Date(cert.revokedAt).toLocaleDateString() : "Recorded"}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {cert.revocationTransactionHash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${cert.revocationTransactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                        >
                          <span className="truncate max-w-[120px]">{cert.revocationTransactionHash}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-secondary text-[11px] font-mono">Recorded in DB</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
