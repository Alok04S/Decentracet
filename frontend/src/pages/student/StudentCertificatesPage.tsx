import React, { useState, useEffect } from "react";
import { Award, Download, QrCode, Copy, Check, ExternalLink, Search, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { QrModal } from "../../components/common/QrModal";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { CertificateParchmentModal } from "../../components/common/CertificateParchmentModal";

export const StudentCertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCertForQr, setSelectedCertForQr] = useState<any>(null);
  const [selectedCertForParchment, setSelectedCertForParchment] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCerts = async () => {
      setLoading(true);
      try {
        const res = await api.get("/certificates");
        if (res.data.success) {
          setCertificates(res.data.data);
        }
      } catch (err) {
        console.error("Fetch student certificates error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCerts();
  }, []);

  const handleCopyUrl = (certId: string) => {
    const url = `${window.location.origin}/verify/${encodeURIComponent(certId)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = certificates.filter(
    (c) =>
      c.degree.toLowerCase().includes(search.toLowerCase()) ||
      c.certificateId.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy">My Academic Credentials</h1>
        <p className="text-xs text-secondary mt-1">
          Cryptographically signed digital credentials issued to your authenticated account.
        </p>
      </div>

      <div className="enterprise-card p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by degree title, certificate ID, or department..."
            className="enterprise-input pl-9 text-xs"
          />
        </div>
      </div>

      <div className="enterprise-card overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading your credentials..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No Matching Credentials Found"
            description="You currently have no certificates matching your search query."
            icon={Award}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border text-secondary">
                <tr>
                  <th className="py-3 px-4 font-semibold">Certificate ID</th>
                  <th className="py-3 px-4 font-semibold">Degree Title</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Issue Date</th>
                  <th className="py-3 px-4 font-semibold">Ledger Status</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((cert) => (
                  <tr key={cert._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-navy">
                      <Link to={`/verify/${cert.certificateId}`} target="_blank" className="text-primary hover:underline">
                        {cert.certificateId}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-navy">{cert.degree}</td>
                    <td className="py-3.5 px-4 text-secondary">{cert.department}</td>
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
                          className="enterprise-btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 text-amber-700 hover:text-amber-900 border-amber-200 bg-amber-50/50"
                          title="View Diploma Parchment"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Diploma
                        </button>

                        <a
                          href={`/api/certificates/${encodeURIComponent(cert.certificateId)}/pdf`}
                          download
                          className="enterprise-btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </a>

                        <button
                          onClick={() => setSelectedCertForQr(cert)}
                          className="enterprise-btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          QR
                        </button>

                        <button
                          onClick={() => handleCopyUrl(cert.certificateId)}
                          className="enterprise-btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1"
                          title="Copy Link"
                        >
                          {copiedId === cert.certificateId ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCertForQr && (
        <QrModal
          isOpen={true}
          certificateId={selectedCertForQr.certificateId}
          studentName={selectedCertForQr.studentName}
          onClose={() => setSelectedCertForQr(null)}
        />
      )}

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
