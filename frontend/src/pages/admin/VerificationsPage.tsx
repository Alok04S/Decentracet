import React, { useState, useEffect } from "react";
import { SearchCheck, RefreshCw, FileText, QrCode, Search } from "lucide-react";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";

export const VerificationsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/recent-verifications");
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error("Fetch verifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Verification Audit Records</h1>
          <p className="text-xs text-secondary mt-1">
            Real-time record of public queries, cryptographic PDF uploads, and QR code scans.
          </p>
        </div>

        <button onClick={fetchLogs} className="enterprise-btn-secondary text-xs flex items-center gap-1.5 self-start">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Activity
        </button>
      </div>

      <div className="enterprise-card overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading verification audit logs..." />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No Verification Logs Found"
            description="When employers, verifiers, or graduates perform cryptographic checks via the public portal, the audit logs appear here."
            icon={SearchCheck}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border text-secondary">
                <tr>
                  <th className="py-3 px-4 font-semibold">Target Certificate / Hash</th>
                  <th className="py-3 px-4 font-semibold">Verification Method</th>
                  <th className="py-3 px-4 font-semibold">Cryptographic Result</th>
                  <th className="py-3 px-4 font-semibold text-right">Verification Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-navy">
                      {log.certificateId || (
                        <span className="text-secondary text-[11px] truncate max-w-[200px] block font-mono">
                          {log.uploadedFileHash || "Direct PDF Byte Hash"}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-secondary capitalize font-medium">
                        {log.verificationMethod === "pdf_upload" && <FileText className="w-3.5 h-3.5 text-primary" />}
                        {log.verificationMethod === "qr_scan" && <QrCode className="w-3.5 h-3.5 text-primary" />}
                        {log.verificationMethod === "id" && <Search className="w-3.5 h-3.5 text-primary" />}
                        {log.verificationMethod.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={log.verificationResult} type="verification" />
                    </td>

                    <td className="py-3.5 px-4 text-right text-secondary">
                      {new Date(log.verifiedAt).toLocaleString()}
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
