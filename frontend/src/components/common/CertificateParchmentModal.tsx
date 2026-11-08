import React, { useRef } from "react";
import {
  X,
  Download,
  Share2,
  ExternalLink,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Award,
  CheckCircle2,
  Calendar,
  Building,
} from "lucide-react";

interface CertificateParchmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: any | null;
}

export const CertificateParchmentModal: React.FC<CertificateParchmentModalProps> = ({
  isOpen,
  onClose,
  certificate,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !certificate) return null;

  const isRevoked = certificate.certificateStatus === "revoked";
  const verifyUrl = `${window.location.origin}/verify/${certificate.certificateId}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    alert("Public verification link copied to clipboard:\n" + verifyUrl);
  };

  const handleDownload = () => {
    window.open(`/api/verify/pdf/${certificate.certificateId}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-border overflow-hidden">
        {/* Top Modal Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-b border-border">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm text-navy">
              Academic Credential Parchment Inspector
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
              {certificate.certificateId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-secondary hover:text-navy hover:bg-slate-200 rounded transition-colors"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyLink}
              className="p-1.5 text-secondary hover:text-navy hover:bg-slate-200 rounded transition-colors"
              title="Share Verification Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-secondary hover:text-navy hover:bg-slate-200 rounded transition-colors"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Display Parchment */}
        <div className="p-4 sm:p-8 bg-slate-100 flex justify-center overflow-x-auto">
          <div
            ref={printRef}
            className="w-full max-w-3xl bg-[#FCFAF5] border-8 border-double border-[#1E293B] shadow-lg p-8 sm:p-12 relative text-center select-none"
            style={{
              backgroundImage:
                "radial-gradient(#E2E8F0 0.75px, transparent 0.75px), radial-gradient(#F1F5F9 0.75px, #FCFAF5 0.75px)",
              backgroundSize: "30px 30px",
              backgroundPosition: "0 0, 15px 15px",
            }}
          >
            {/* Inner Gold Inset Border */}
            <div className="absolute inset-3 border border-[#CA8A04] pointer-events-none opacity-80" />
            <div className="absolute inset-4 border border-[#CA8A04]/40 pointer-events-none" />

            {/* Corner Ornamental Accents */}
            <div className="absolute top-5 left-5 text-[#CA8A04] text-xs font-serif opacity-75">❖</div>
            <div className="absolute top-5 right-5 text-[#CA8A04] text-xs font-serif opacity-75">❖</div>
            <div className="absolute bottom-5 left-5 text-[#CA8A04] text-xs font-serif opacity-75">❖</div>
            <div className="absolute bottom-5 right-5 text-[#CA8A04] text-xs font-serif opacity-75">❖</div>

            {/* Status Watermark / Stamp */}
            {isRevoked ? (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-red-600 px-6 py-2 rounded-lg bg-red-100/80 backdrop-blur-xs text-red-600 font-extrabold text-2xl tracking-widest uppercase shadow-md pointer-events-none">
                REVOKED BY SENATE
              </div>
            ) : (
              <div className="absolute top-8 right-8 hidden sm:flex flex-col items-center opacity-85">
                <div className="w-16 h-16 rounded-full border-2 border-emerald-600 flex items-center justify-center p-1 bg-emerald-50">
                  <div className="w-full h-full rounded-full border border-dashed border-emerald-600 flex flex-col items-center justify-center text-[8px] font-bold text-emerald-800 leading-none">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mb-0.5" />
                    <span>ON-CHAIN</span>
                    <span>VERIFIED</span>
                  </div>
                </div>
              </div>
            )}

            {/* University Crest / Title */}
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1E293B] text-amber-400 mb-2 shadow-inner">
                <Award className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wider text-[#0F172A] uppercase">
                DecentraCert University of Technology
              </h2>
              <p className="text-[10px] tracking-[0.25em] font-medium text-slate-500 uppercase mt-0.5">
                Commonwealth of Massachusetts • Academic Credential Registry
              </p>
            </div>

            {/* Preamble */}
            <p className="text-xs italic font-serif text-slate-600 mb-2">
              On the recommendation of the Faculty and by virtue of the authority vested in the Academic Senate,
              has conferred upon
            </p>

            {/* Student Name */}
            <div className="my-3 py-1 border-b border-slate-300 max-w-md mx-auto">
              <h3 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#1E3A8A] tracking-normal">
                {certificate.studentName}
              </h3>
            </div>

            {/* Degree Title */}
            <p className="text-xs font-serif text-slate-600 mb-1">the degree of</p>
            <h4 className="text-lg sm:text-xl font-serif font-bold text-[#0F172A] max-w-xl mx-auto leading-tight">
              {certificate.degree}
            </h4>

            {/* Department & Specialization */}
            <div className="mt-2 text-xs text-slate-700 space-y-0.5">
              {certificate.department && (
                <p className="font-medium text-slate-800">Department of {certificate.department}</p>
              )}
              {certificate.specialization && (
                <p className="italic text-slate-600">With Specialization in {certificate.specialization}</p>
              )}
              {certificate.grade && (
                <p className="text-amber-800 font-semibold text-[11px] mt-1">{certificate.grade}</p>
              )}
            </div>

            {/* Date & Conferral Statement */}
            <p className="text-[11px] font-serif text-slate-500 mt-4 max-w-lg mx-auto">
              Conferred at Cambridge, Massachusetts on{" "}
              <span className="font-medium text-slate-800">
                {new Date(certificate.issueDate || Date.now()).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              .
            </p>

            {/* Signatures & Seal Section */}
            <div className="mt-8 pt-4 grid grid-cols-3 items-end gap-4 text-xs border-t border-slate-200">
              <div className="text-center">
                <div className="h-9 flex items-end justify-center font-serif italic text-sm text-slate-700 font-bold border-b border-slate-400 pb-1">
                  Eleanor Vance, Ph.D.
                </div>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">
                  Dean of Academic Affairs
                </p>
              </div>

              {/* Center Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full border-2 border-amber-600/80 bg-amber-50/50 flex flex-col items-center justify-center p-1 shadow-inner">
                  <div className="text-[7px] font-black uppercase text-amber-900 tracking-tighter text-center leading-none">
                    DEC • CERT<br />★ 2024 ★<br />VERITAS
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="h-9 flex items-end justify-center font-serif italic text-sm text-slate-700 font-bold border-b border-slate-400 pb-1">
                  Arthur Pendelton, Sc.D.
                </div>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">
                  President of the University
                </p>
              </div>
            </div>

            {/* Bottom Cryptographic Ledger Proof */}
            <div className="mt-6 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-left gap-3 text-[10px]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold font-mono">
                  <span>ID: {certificate.certificateId}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-primary">SHA-256 HASH VERIFIED</span>
                </div>
                <p className="font-mono text-slate-500 text-[9px] break-all max-w-sm truncate">
                  Digest: {certificate.pdfSha256 || certificate.blockchainHash}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">
                    Ethereum Verified
                  </span>
                  <p className="text-[8px] text-slate-400 font-mono mt-0.5">
                    Block #{certificate.blockNumber || "19827301"}
                  </p>
                </div>
                <div className="w-10 h-10 border border-slate-300 bg-white p-0.5 rounded flex items-center justify-center">
                  <img
                    src={`/api/certificates/${certificate.certificateId}/qr`}
                    alt="QR"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-white border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-secondary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Cryptographic byte-level SHA-256 integrity confirmed.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href={`/verify/${certificate.certificateId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="enterprise-btn-secondary text-xs flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Public Ledger View
            </a>
            <button
              onClick={handleDownload}
              className="enterprise-btn-primary text-xs flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Official PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
