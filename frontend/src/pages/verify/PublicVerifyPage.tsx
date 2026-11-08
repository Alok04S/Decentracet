import React, { useState, useRef } from "react";
import {
  ShieldCheck,
  Search,
  UploadCloud,
  QrCode,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Download,
  Fingerprint,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";

interface VerificationResponse {
  certificateId: string;
  studentName: string;
  institutionName: string;
  degree: string;
  department: string;
  specialization?: string;
  graduationYear: number;
  issueDate: string;
  certificateType: string;
  verificationResult: "VALID" | "INVALID_TAMPERED" | "REVOKED" | "NOT_FOUND" | "PENDING_OR_UNAVAILABLE";
  verificationMessage: string;
  pdfSha256: string;
  blockchainHash: string;
  isHashMatch: boolean;
  blockchainStatus: string;
  networkType: string;
  contractAddress: string;
  transactionHash?: string;
  blockNumber?: number;
  issuerAddress?: string;
  revocationStatus: {
    isRevoked: boolean;
    revokedAt?: string;
    revocationReason?: string;
    revocationTransactionHash?: string;
  };
  isDemoRecord: boolean;
  verifiedAt: string;
}

export const PublicVerifyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"id" | "pdf" | "qr">("id");
  const [certIdInput, setCertIdInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [comparison, setComparison] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab 1: Verify by ID
  const handleVerifyById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certIdInput.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setResult(null);
    setComparison(null);

    try {
      const res = await api.post("/verify/id", { certificateId: certIdInput.trim() });
      if (res.data.success) {
        setResult(res.data.data);
      }
    } catch (err: any) {
      if (err.response?.data?.data) {
        setResult(err.response.data.data);
      } else {
        setErrorMsg(err.response?.data?.message || "Verification request failed. Credential not found.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Tab 2: Verify by PDF Upload
  const handleVerifyByPdf = async (fileToVerify?: File) => {
    const targetFile = fileToVerify || uploadedFile;
    if (!targetFile) return;

    setLoading(true);
    setErrorMsg("");
    setResult(null);
    setComparison(null);

    const formData = new FormData();
    formData.append("certificatePdf", targetFile);
    if (certIdInput.trim()) {
      formData.append("certificateId", certIdInput.trim());
    }

    try {
      const res = await api.post("/verify/pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setResult(res.data.data);
        if (res.data.comparison) setComparison(res.data.comparison);
      }
    } catch (err: any) {
      if (err.response?.data?.data) {
        setResult(err.response.data.data);
        if (err.response.data.comparison) setComparison(err.response.data.comparison);
      } else {
        setErrorMsg(err.response?.data?.message || "Cryptographic verification failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      handleVerifyByPdf(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".pdf")) {
        setUploadedFile(file);
        handleVerifyByPdf(file);
      } else {
        setErrorMsg("Please upload an authentic .pdf file.");
      }
    }
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="h-16 bg-surface border-b border-border shadow-subtle px-4 lg:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-navy">DecentraCert</span>
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-primary">
              Public Ledger Gateway
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/login" className="enterprise-btn-secondary text-xs py-1.5 px-3">
            Institutional Login
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">Verify Academic Credentials</h1>
          <p className="text-secondary text-sm mt-2 max-w-xl mx-auto">
            Independently validate authenticity and cryptographic integrity anchored to the Ethereum blockchain.
          </p>
        </div>

        {/* Verification Options Card */}
        <div className="enterprise-card p-6 mb-8">
          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              onClick={() => setActiveTab("id")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === "id"
                  ? "border-primary text-primary bg-primary-surface/40"
                  : "border-transparent text-secondary hover:text-navy"
              }`}
            >
              <Search className="w-4 h-4" />
              Certificate ID Lookup
            </button>

            <button
              onClick={() => setActiveTab("pdf")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === "pdf"
                  ? "border-primary text-primary bg-primary-surface/40"
                  : "border-transparent text-secondary hover:text-navy"
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              PDF File Byte Tamper Check
            </button>

            <button
              onClick={() => setActiveTab("qr")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === "qr"
                  ? "border-primary text-primary bg-primary-surface/40"
                  : "border-transparent text-secondary hover:text-navy"
              }`}
            >
              <QrCode className="w-4 h-4" />
              Scan QR Code
            </button>
          </div>

          {/* Tab 1: ID Search Form */}
          {activeTab === "id" && (
            <form onSubmit={handleVerifyById} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  Enter Unique Certificate Identifier
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={certIdInput}
                    onChange={(e) => setCertIdInput(e.target.value)}
                    placeholder="e.g. DC-2026-XXXXXXXX"
                    className="enterprise-input font-mono uppercase"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading || !certIdInput.trim()}
                    className="enterprise-btn-primary shrink-0 px-5 text-xs flex items-center gap-1.5"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Verify Credential
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-secondary">Quick Test Samples:</span>
                <button
                  type="button"
                  onClick={() => setCertIdInput("DC-2026-STU001-01")}
                  className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 text-[10px] font-mono font-semibold transition-colors"
                >
                  DC-2026-STU001-01 (Active BS Degree)
                </button>
                <button
                  type="button"
                  onClick={() => setCertIdInput("DC-2026-STU001-02")}
                  className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 text-[10px] font-mono font-semibold transition-colors"
                >
                  DC-2026-STU001-02 (Dean's Honor Roll)
                </button>
                <button
                  type="button"
                  onClick={() => setCertIdInput("DC-2026-STU003-04")}
                  className="px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-mono font-semibold transition-colors"
                >
                  DC-2026-STU003-04 (Revoked Credential)
                </button>
              </div>

              <p className="text-[11px] text-secondary">
                The identifier is permanently encoded at the bottom of official certificates and within the QR code.
              </p>
            </form>
          )}

          {/* Tab 2: PDF Upload & Tamper Detection */}
          {activeTab === "pdf" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary-surface"
                    : "border-border hover:border-slate-300 bg-slate-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-primary mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-navy">
                  {uploadedFile ? uploadedFile.name : "Click or Drag & Drop Academic Certificate PDF"}
                </h3>
                <p className="text-xs text-secondary mt-1">
                  Reads exact binary bytes directly. Performs SHA-256 cryptographic comparison.
                </p>
                <p className="text-[11px] text-slate-400 mt-2">Maximum file size: 10MB • Only .pdf files</p>
              </div>

              {/* Optional Certificate ID hint for targeted tamper check */}
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Target Certificate ID (Optional — for targeted document tamper comparison)
                </label>
                <input
                  type="text"
                  value={certIdInput}
                  onChange={(e) => setCertIdInput(e.target.value)}
                  placeholder="e.g. DC-2026-XXXXXXXX"
                  className="enterprise-input font-mono uppercase text-xs"
                />
              </div>

              {uploadedFile && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-xs">
                  <div className="flex items-center gap-2 text-navy">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-medium truncate">{uploadedFile.name}</span>
                    <span className="text-secondary font-mono">({Math.round(uploadedFile.size / 1024)} KB)</span>
                  </div>
                  <button
                    onClick={() => handleVerifyByPdf()}
                    disabled={loading}
                    className="enterprise-btn-primary text-xs py-1.5 px-3"
                  >
                    {loading ? "Computing SHA-256..." : "Re-Verify File"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: QR Scanner Info */}
          {activeTab === "qr" && (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-navy">Mobile or Camera QR Scanner</h3>
              <p className="text-xs text-secondary max-w-md mx-auto">
                Scan the QR code printed on any DecentraCert certificate using your phone's camera. The QR code
                directs immediately to the canonical public verification URL.
              </p>
              <div className="pt-2">
                <p className="text-[11px] font-mono text-secondary bg-slate-100 p-2 rounded max-w-sm mx-auto">
                  Format: https://.../verify/DC-YYYY-XXXXXXXX
                </p>
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mt-5 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-error">Verification Query Failed</h4>
                <p className="text-xs text-red-700 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Verification Result Report */}
        {result && (
          <div className="enterprise-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Verdict Header Banner */}
            <div
              className={`p-6 border-b flex items-start justify-between ${
                result.verificationResult === "VALID"
                  ? "bg-green-50/70 border-green-200 text-green-900"
                  : result.verificationResult === "INVALID_TAMPERED"
                  ? "bg-red-50/70 border-red-200 text-red-900"
                  : result.verificationResult === "REVOKED"
                  ? "bg-amber-50/70 border-amber-200 text-amber-900"
                  : "bg-blue-50/70 border-blue-200 text-blue-900"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  {result.verificationResult === "VALID" && (
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  )}
                  {result.verificationResult === "INVALID_TAMPERED" && (
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}
                  {result.verificationResult === "REVOKED" && (
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  )}
                  {result.verificationResult === "PENDING_OR_UNAVAILABLE" && (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Clock className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight">
                      {result.verificationResult === "VALID" && "AUTHENTIC CREDENTIAL VERIFIED"}
                      {result.verificationResult === "INVALID_TAMPERED" && "TAMPERED / INVALID DOCUMENT"}
                      {result.verificationResult === "REVOKED" && "CREDENTIAL OFFICIALLY REVOKED"}
                      {result.verificationResult === "PENDING_OR_UNAVAILABLE" && "BLOCKCHAIN VERIFICATION PENDING"}
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

              {/* PDF Download Button */}
              <a
                href={`/api/verify/${encodeURIComponent(result.certificateId)}/pdf`}
                download
                className="enterprise-btn-secondary text-xs py-2 px-3 shrink-0 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </a>
            </div>

            {/* Credential Data Summary */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-border">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-secondary mb-3">
                  Academic Credential Details
                </h4>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <dt className="text-secondary">Student Name</dt>
                    <dd className="font-bold text-navy">{result.studentName}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <dt className="text-secondary">Issuing Institution</dt>
                    <dd className="font-semibold text-navy">{result.institutionName}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <dt className="text-secondary">Degree Program</dt>
                    <dd className="font-semibold text-navy">{result.degree}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <dt className="text-secondary">Department</dt>
                    <dd className="text-navy">{result.department}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <dt className="text-secondary">Class of / Graduation</dt>
                    <dd className="text-navy">{result.graduationYear}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-secondary">Conferral Date</dt>
                    <dd className="text-navy">{new Date(result.issueDate).toLocaleDateString()}</dd>
                  </div>
                </dl>
              </div>

              {/* Cryptographic & Blockchain Evidence */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-secondary mb-3">
                  Cryptographic & On-Chain Ledger Evidence
                </h4>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <dt className="text-secondary">Certificate ID</dt>
                    <dd className="font-mono font-bold text-navy">{result.certificateId}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <dt className="text-secondary">Blockchain Network</dt>
                    <dd className="font-semibold text-navy capitalize">
                      {result.networkType === "sepolia" ? "Ethereum Sepolia (Chain 11155111)" : "Hardhat Local (Chain 31337)"}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <dt className="text-secondary">Contract Address</dt>
                    <dd className="font-mono text-secondary truncate max-w-[200px]" title={result.contractAddress}>
                      {result.contractAddress || "Pending Deployment"}
                    </dd>
                  </div>
                  {result.blockNumber && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <dt className="text-secondary">Anchored Block Number</dt>
                      <dd className="font-mono font-semibold text-navy">#{result.blockNumber}</dd>
                    </div>
                  )}
                  {result.transactionHash && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <dt className="text-secondary">Transaction Hash</dt>
                      <dd className="font-mono text-primary flex items-center gap-1">
                        <span className="truncate max-w-[160px]">{result.transactionHash}</span>
                        {result.networkType === "sepolia" && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${result.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                            title="View on Etherscan"
                          >
                            <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Cryptographic Hash Comparison Panel */}
            <div className="p-6 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-primary" />
                  Exact SHA-256 PDF Byte Hash (Stored on Ethereum as bytes32)
                </span>
                <button
                  onClick={() => handleCopyHash(result.pdfSha256)}
                  className="text-xs text-primary hover:text-primary-hover flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Hash
                </button>
              </div>

              <div className="p-3 bg-surface border border-border rounded-lg font-mono text-xs text-navy break-all selection:bg-blue-100">
                {result.pdfSha256}
              </div>

              {comparison && !comparison.matches && (
                <div className="mt-3 p-3 rounded-lg bg-red-100/60 border border-red-300 text-xs">
                  <div className="font-bold text-error mb-1">Cryptographic Mismatch Detected:</div>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div>
                      <span className="text-secondary">Uploaded PDF SHA-256: </span>
                      <span className="text-red-700 font-bold">{comparison.uploadedPdfSha256}</span>
                    </div>
                    <div>
                      <span className="text-secondary">Registered Document SHA-256: </span>
                      <span className="text-green-700 font-bold">{comparison.registeredPdfSha256}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
