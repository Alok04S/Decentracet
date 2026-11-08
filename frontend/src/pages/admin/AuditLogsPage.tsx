import React, { useState, useEffect } from "react";
import { ScrollText, RefreshCw, Filter, User } from "lucide-react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/audit-logs");
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error("Fetch audit logs error:", err);
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
          <h1 className="text-2xl font-bold tracking-tight text-navy">Administrative Audit Trail</h1>
          <p className="text-xs text-secondary mt-1">
            Immutable log of all administrative actions, certificate issuances, revocations, and system recoveries.
          </p>
        </div>

        <button onClick={fetchLogs} className="enterprise-btn-secondary text-xs flex items-center gap-1.5 self-start">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Audit Trail
        </button>
      </div>

      <div className="enterprise-card overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Querying audit records..." />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No Administrative Actions Recorded"
            description="Administrative actions such as credential issuance, revocation, and transaction reconciliation are logged here automatically."
            icon={ScrollText}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border text-secondary">
                <tr>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Actor</th>
                  <th className="py-3 px-4 font-semibold">Entity Type & ID</th>
                  <th className="py-3 px-4 font-semibold">Metadata Summary</th>
                  <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-navy">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-secondary" />
                        <span>{log.actorEmail}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-secondary">
                      {log.entityType}: <span className="font-semibold text-navy">{log.entityId}</span>
                    </td>

                    <td className="py-3.5 px-4 text-secondary text-[11px] font-mono truncate max-w-xs">
                      {log.metadata ? JSON.stringify(log.metadata) : "—"}
                    </td>

                    <td className="py-3.5 px-4 text-right text-secondary">
                      {new Date(log.timestamp).toLocaleString()}
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
