import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  QrCode,
  ExternalLink,
  ShieldBan,
  Copy,
  Check,
  RefreshCw,
  PlusCircle,
  FileCheck2,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { ConfirmationModal } from "../../components/common/ConfirmationModal";
import { QrModal } from "../../components/common/QrModal";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { CertificateParchmentModal } from "../../components/common/CertificateParchmentModal";

export const AllCertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [blockchainFilter, setBlockchainFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [selectedCertForRevoke, setSelectedCertForRevoke] = useState<any>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [selectedCertForQr, setSelectedCertForQr] = useState<any>(null);
  const [selectedCertForParchment, setSelectedCertForParchment] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter) params.append("status", statusFilter);
      if (blockchainFilter) params.append("blockchainStatus", blockchainFilter);
      if (departmentFilter) params.append("department", departmentFilter);
      if (typeFilter) params.append("certificateType", typeFilter);

      const res = await api.get(`/certificates?${params.toString()}`);
      if (res.data.success) {
        setCertificates(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error("Fetch certificates error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [page, statusFilter, blockchainFilter, departmentFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCertificates();
  };

  const handleCopyUrl = (certId: string) => {
    const url = `${window.location.origin}/verify/${encodeURIComponent(certId)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevokeConfirm = async (reason?: string) => {
    if (!selectedCertForRevoke) return;
    setRevokeLoading(true);
    try {
      const res = await api.post(`/certificates/${selectedCertForRevoke.certificateId}/revoke`, {
        reason,
      });
      if (res.data.success) {
        setSelectedCertForRevoke(null);
        fetchCertificates();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to revoke certificate.");
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">All Institutional Credentials</h1>
          <p className="text-xs text-secondary mt-1">
            Browse, search, download official PDFs, inspect blockchain hashes, and manage credential lifecycles.
          </p>
        </div>

        <Link to="/admin/issue-certificate" className="enterprise-btn-primary text-xs flex items-center gap-1.5 self-start">
          <PlusCircle className="w-4 h-4" />
          Issue New Certificate
        </Link>
      </div>

      {/* Filters & Search Bar */}
      <div className="enterprise-card p-4">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, enrollment ID, certificate ID, or degree program..."
              className="enterprise-input pl-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPage(1);
                }}
                className="enterprise-input text-xs"
              >
                <option value="">All Academic Departments</option>
                <option value="Computer Science">Computer Science & Software</option>
                <option value="Artificial Intelligence">AI & Robotics</option>
                <option value="Cybersecurity">Cybersecurity & Cryptography</option>
                <option value="Data Science">Data Science & Analytics</option>
                <option value="Electrical">Electrical & Computer Eng.</option>
                <option value="Biotechnology">Biotechnology & Genomics</option>
                <option value="Business">Business & Quantitative Finance</option>
                <option value="Mechanical">Mechanical & Autonomous Systems</option>
                <option value="Quantum">Quantum Computing & Physics</option>
                <option value="Information Systems">Information Systems & Cloud</option>
              </select>
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="enterprise-input text-xs"
              >
                <option value="">All Credential Types</option>
                <option value="Bachelor">Bachelor Degree Diploma</option>
                <option value="Dean">Dean's Honor Roll</option>
                <option value="Concentration">Concentration & Minor</option>
                <option value="Thesis">Senior Thesis Defense</option>
                <option value="Practicum">Industrial Practicum</option>
                <option value="Professional">Professional Certification</option>
                <option value="Fellowship">University Fellowship</option>
                <option value="Integrity">Academic Integrity</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="enterprise-input text-xs"
              >
                <option value="">All Credential Statuses</option>
                <option value="active">Active Credentials</option>
                <option value="revoked">Revoked Credentials</option>
              </select>
            </div>

            <div className="flex gap-2">
              <select
                value={blockchainFilter}
                onChange={(e) => {
                  setBlockchainFilter(e.target.value);
                  setPage(1);
                }}
                className="enterprise-input text-xs"
              >
                <option value="">All Ledger States</option>
                <option value="confirmed">Confirmed On-Chain</option>
                <option value="submitting">Pending / Mempool</option>
                <option value="failed">Failed</option>
                <option value="unconfigured">Unanchored Demo</option>
              </select>

              <button type="submit" className="enterprise-btn-primary text-xs py-2 px-3 shrink-0">
                Filter
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Certificates Data Table */}
      <div className="enterprise-card overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Querying certificate registry..." />
        ) : certificates.length === 0 ? (
          <EmptyState
            title="No Certificates Found"
            description="No certificate records match your selected criteria or search query."
            icon={FileCheck2}
            actionLabel="Issue First Certificate"
            onAction={() => (window.location.href = "/admin/issue-certificate")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border text-secondary">
                <tr>
                  <th className="py-3 px-4 font-semibold">Certificate ID</th>
                  <th className="py-3 px-4 font-semibold">Student / Candidate</th>
                  <th className="py-3 px-4 font-semibold">Degree & Department</th>
                  <th className="py-3 px-4 font-semibold">Conferral Date</th>
                  <th className="py-3 px-4 font-semibold">Ledger Status</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {certificates.map((cert) => (
                  <tr key={cert._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-navy">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/verify/${cert.certificateId}`} target="_blank" className="text-primary hover:underline">
                          {cert.certificateId}
                        </Link>
                        {cert.isDemoRecord && (
                          <span
                            className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800"
                            title="Development Demo Data — Not Real Blockchain Record"
                          >
                            DEMO
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-navy">{cert.studentName}</div>
                      <div className="text-[11px] text-secondary font-mono">{cert.studentId}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-navy truncate max-w-[200px]">{cert.degree}</div>
                      <div className="text-[11px] text-secondary truncate max-w-[200px]">{cert.department}</div>
                    </td>

                    <td className="py-3.5 px-4 text-secondary">
                      {new Date(cert.issueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={cert.blockchainStatus} type="blockchain" />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={cert.certificateStatus} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCertForParchment(cert)}
                          className="p-1.5 rounded hover:bg-amber-50 text-amber-600 hover:text-amber-800 transition-colors"
                          title="View Diploma Parchment"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <a
                          href={`/api/certificates/${encodeURIComponent(cert.certificateId)}/pdf`}
                          download
                          className="p-1.5 rounded hover:bg-slate-100 text-secondary hover:text-navy transition-colors"
                          title="Download Official PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => setSelectedCertForQr(cert)}
                          className="p-1.5 rounded hover:bg-slate-100 text-secondary hover:text-navy transition-colors"
                          title="View QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleCopyUrl(cert.certificateId)}
                          className="p-1.5 rounded hover:bg-slate-100 text-secondary hover:text-navy transition-colors"
                          title="Copy Public Verification Link"
                        >
                          {copiedId === cert.certificateId ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {cert.networkType === "sepolia" && cert.transactionHash && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${cert.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-slate-100 text-primary transition-colors"
                            title="View on Sepolia Etherscan"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        {cert.certificateStatus === "active" && (
                          <button
                            onClick={() => setSelectedCertForRevoke(cert)}
                            className="p-1.5 rounded hover:bg-red-50 text-secondary hover:text-error transition-colors"
                            title="Revoke Certificate"
                          >
                            <ShieldBan className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-border flex items-center justify-between text-xs text-secondary">
            <span>
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total credentials)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="enterprise-btn-secondary text-xs py-1 px-3 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="enterprise-btn-secondary text-xs py-1 px-3 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Revocation Modal */}
      {selectedCertForRevoke && (
        <ConfirmationModal
          isOpen={true}
          title={`Revoke Certificate ${selectedCertForRevoke.certificateId}`}
          description={`You are about to revoke the credential for ${selectedCertForRevoke.studentName}. This action will be permanently recorded on-chain and public verifications will report REVOKED.`}
          confirmLabel="Execute Revocation"
          isDestructive={true}
          requireReason={true}
          reasonPlaceholder="Specify academic misconduct, administrative annulment, or error correction reason..."
          isLoading={revokeLoading}
          onConfirm={handleRevokeConfirm}
          onClose={() => setSelectedCertForRevoke(null)}
        />
      )}

      {/* QR Code Modal */}
      {selectedCertForQr && (
        <QrModal
          isOpen={true}
          certificateId={selectedCertForQr.certificateId}
          studentName={selectedCertForQr.studentName}
          onClose={() => setSelectedCertForQr(null)}
        />
      )}

      {/* Diploma Parchment Modal */}
      {selectedCertForParchment && (
        <CertificateParchmentModal
          isOpen={true}
          certificate={selectedCertForParchment}
          onClose={() => setSelectedCertForParchment(null)}
        />
      )}
    </div>
  );
};
