import React, { useState, useEffect } from "react";
import { Award, CheckCircle2, XCircle, Download, QrCode, Copy, Check, ExternalLink, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { StatCard } from "../../components/common/StatCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { QrModal } from "../../components/common/QrModal";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertForQr, setSelectedCertForQr] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentCerts = async () => {
      try {
        const res = await api.get("/certificates");
        if (res.data.success) {
          setCertificates(res.data.data);
        }
      } catch (err) {
        console.error("Student certs fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentCerts();
  }, []);

  const handleCopyUrl = (certId: string) => {
    const url = `${window.location.origin}/verify/${encodeURIComponent(certId)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeCount = certificates.filter((c) => c.certificateStatus === "active").length;
  const revokedCount = certificates.filter((c) => c.certificateStatus === "revoked").length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="enterprise-card p-6 bg-gradient-to-r from-blue-50/50 to-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy">Welcome, {user?.name}</h1>
            <p className="text-xs text-secondary">
              Graduate Student ID: <span className="font-mono font-semibold text-navy">{user?.studentId || "Enrolled"}</span>
            </p>
          </div>
        </div>
        <p className="text-xs text-secondary mt-1 max-w-xl">
          Your academic qualifications are permanently anchored to the Ethereum blockchain. Share your public verification
          links with recruiters, employers, and higher education institutions.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Credentials"
          value={certificates.length}
          subtitle="Issued to your student account"
          icon={Award}
          badgeColor="primary"
        />
        <StatCard
          title="Active & Verifiable"
          value={activeCount}
          subtitle="Confirmed on Ethereum blockchain"
          icon={CheckCircle2}
          badgeColor="success"
        />
        <StatCard
          title="Revoked Records"
          value={revokedCount}
          subtitle="Annulled or superseded"
          icon={XCircle}
          badgeColor="error"
        />
      </div>

      {/* Credential Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-secondary">
            Your Issued Credentials
          </h2>
          <Link to="/student/certificates" className="text-xs font-semibold text-primary hover:underline">
            View Full List
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner label="Fetching your academic certificates..." />
        ) : certificates.length === 0 ? (
          <EmptyState
            title="No Certificates Issued Yet"
            description="Your institution has not published any digital certificates for this student account yet. Once issued, your verified diplomas and QR codes will appear here."
            icon={Award}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <div key={cert._id} className="enterprise-card p-5 hover:shadow-card transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-secondary">{cert.certificateId}</span>
                    <h3 className="text-sm font-bold text-navy mt-0.5">{cert.degree}</h3>
                    <p className="text-xs text-secondary">{cert.department}</p>
                  </div>
                  <StatusBadge status={cert.certificateStatus} />
                </div>

                <div className="py-2.5 my-2 border-y border-border text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-secondary">Class Year:</span>
                    <span className="font-semibold text-navy">{cert.graduationYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Conferral Date:</span>
                    <span className="text-navy">{new Date(cert.issueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Blockchain Status:</span>
                    <span className="font-semibold text-primary capitalize">{cert.blockchainStatus}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={`/api/certificates/${encodeURIComponent(cert.certificateId)}/pdf`}
                    download
                    className="enterprise-btn-primary text-xs py-1.5 px-3 flex-1 flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </a>

                  <button
                    onClick={() => setSelectedCertForQr(cert)}
                    className="enterprise-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    title="View QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR
                  </button>

                  <button
                    onClick={() => handleCopyUrl(cert.certificateId)}
                    className="enterprise-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    title="Copy Public Verification Link"
                  >
                    {copiedId === cert.certificateId ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <Link
                    to={`/verify/${cert.certificateId}`}
                    target="_blank"
                    className="enterprise-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    title="Open Verification Page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
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
    </div>
  );
};
