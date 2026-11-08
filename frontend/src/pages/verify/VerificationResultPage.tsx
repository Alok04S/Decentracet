import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  Fingerprint,
} from "lucide-react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

export const VerificationResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchVerification = async () => {
      if (!id) return;
      setLoading(true);
      setErrorMsg("");

      try {
        const res = await api.post("/verify/id", { certificateId: id });
        if (res.data.success) {
          setResult(res.data.data);
        }
      } catch (err: any) {
        if (err.response?.data?.data) {
          setResult(err.response.data.data);
        } else {
          setErrorMsg(err.response?.data?.message || `No record found for Certificate ID "${id}".`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [id]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 bg-surface border-b border-border shadow-subtle px-4 lg:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-navy">DecentraCert</span>
        </Link>
        <Link to="/verify" className="enterprise-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          New Verification Search
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {loading ? (
          <LoadingSpinner label={`Verifying Certificate ID "${id}" against Ethereum registry...`} />
        ) : errorMsg ? (
          <div className="enterprise-card p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-error border border-red-200 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-navy">Verification Record Not Found</h2>
            <p className="text-xs text-secondary max-w-md mx-auto">{errorMsg}</p>
            <div className="pt-2">
              <Link to="/verify" className="enterprise-btn-primary text-xs">
                Back to Public Verification Hub
              </Link>
            </div>
          </div>
        ) : result ? (
          <div className="enterprise-card overflow-hidden shadow-card">
            {/* Verdict Banner */}
            <div
              className={`p-6 border-b flex items-start justify-between ${
                result.verificationResult === "VALID"
                  ? "bg-green-50/80 border-green-200 text-green-900"
                  : result.verificationResult === "REVOKED"
                  ? "bg-amber-50/80 border-amber-200 text-amber-900"
                  : "bg-red-50/80 border-red-200 text-red-900"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  {result.verificationResult === "VALID" && (
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  )}
                  {result.verificationResult === "REVOKED" && (
                    <AlertTriangle className="w-8 h-8 text-amber-600" />
                  )}
                  {result.verificationResult === "INVALID_TAMPERED" && (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight">
                      {result.verificationResult === "VALID" && "AUTHENTIC CREDENTIAL CONFIRMED"}
                      {result.verificationResult === "REVOKED" && "CREDENTIAL OFFICIALLY REVOKED"}
                      {result.verificationResult === "INVALID_TAMPERED" && "TAMPERED / INVALID CREDENTIAL"}
                    </span>
                    {result.isDemoRecord && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                        DEVELOPMENT DEMO RECORD
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 font-medium leading-relaxed">{result.verificationMessage}</p>
                </div>
              </div>

              <a
                href={`/api/verify/${encodeURIComponent(result.certificateId)}/pdf`}
                download
                className="enterprise-btn-secondary text-xs py-2 px-3 shrink-0 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </a>
            </div>

            {/* Credential Attributes */}
            <div className="p-6 border-b border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary mb-4">
                Academic Credential Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-secondary block">Student Name</span>
                  <span className="font-bold text-navy text-sm">{result.studentName}</span>
                </div>
                <div>
                  <span className="text-secondary block">Issuing University</span>
                  <span className="font-semibold text-navy">{result.institutionName}</span>
                </div>
                <div>
                  <span className="text-secondary block">Degree Conferred</span>
                  <span className="font-semibold text-navy">{result.degree}</span>
                </div>
                <div>
                  <span className="text-secondary block">Department</span>
                  <span className="text-navy">{result.department}</span>
                </div>
                <div>
                  <span className="text-secondary block">Graduation Year</span>
                  <span className="text-navy">Class of {result.graduationYear}</span>
                </div>
                <div>
                  <span className="text-secondary block">Conferral Date</span>
                  <span className="text-navy">{new Date(result.issueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Cryptographic Proof */}
            <div className="p-6 bg-slate-50 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-primary" />
                Cryptographic & On-Chain Ledger Verification
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-secondary">SHA-256 PDF Byte Hash</span>
                    <button
                      onClick={() => handleCopy(result.pdfSha256)}
                      className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                    >
                      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </div>
                  <div className="p-2.5 bg-surface border border-border rounded font-mono text-[11px] text-navy break-all">
                    {result.pdfSha256}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-surface border border-border rounded-lg">
                    <span className="text-[11px] text-secondary block">Blockchain Network</span>
                    <span className="font-semibold text-navy">
                      {result.networkType === "sepolia" ? "Ethereum Sepolia (11155111)" : "Hardhat Local (31337)"}
                    </span>
                  </div>

                  {result.blockNumber && (
                    <div className="p-3 bg-surface border border-border rounded-lg">
                      <span className="text-[11px] text-secondary block">Anchored Block</span>
                      <span className="font-mono font-semibold text-navy">#{result.blockNumber}</span>
                    </div>
                  )}
                </div>

                {result.transactionHash && (
                  <div className="p-3 bg-surface border border-border rounded-lg flex items-center justify-between">
                    <div className="truncate mr-2">
                      <span className="text-[11px] text-secondary block">Transaction Hash</span>
                      <span className="font-mono text-xs text-navy truncate block">
                        {result.transactionHash}
                      </span>
                    </div>
                    {result.networkType === "sepolia" && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${result.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="enterprise-btn-secondary text-[11px] py-1 px-2.5 shrink-0 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Etherscan
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};
