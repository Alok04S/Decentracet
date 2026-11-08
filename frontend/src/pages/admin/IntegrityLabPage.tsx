import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Fingerprint,
  FileText,
  Boxes,
  ShieldCheck,
  RefreshCw,
  Zap,
} from "lucide-react";
import { api } from "../../services/api";

export const IntegrityLabPage: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const res = await api.get("/certificates?limit=50");
        if (res.data.success && res.data.data.length > 0) {
          setCertificates(res.data.data);
          setSelectedId(res.data.data[0].certificateId);
        }
      } catch (err) {
        console.error("Error loading certificates for test lab:", err);
      }
    };

    loadCertificates();
  }, []);

  const handleExecuteTest = async () => {
    setRunning(true);
    setErrorMsg("");
    setTestResult(null);

    try {
      const res = await api.post("/integrity-test/execute", {
        certificateId: selectedId || undefined,
      });

      if (res.data.success) {
        setTestResult(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to execute integrity test.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              Certificate Integrity & Tamper Testing Lab
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-primary">
              Live Execution
            </span>
          </div>
          <p className="text-xs text-secondary mt-1">
            Conduct live, byte-for-byte SHA-256 analysis, simulate single-byte file corruption, and observe real-time
            smart contract verification.
          </p>
        </div>

        <button
          onClick={handleExecuteTest}
          disabled={running}
          className="enterprise-btn-primary text-xs py-2.5 px-4 flex items-center gap-2 self-start shadow-sm"
        >
          {running ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running Cryptographic Mutation...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              Execute Live Integrity Suite
            </>
          )}
        </button>
      </div>

      {/* Target Certificate Selector Card */}
      <div className="enterprise-card p-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-2">
          Select Target Credential for Live Tamper Simulation
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="enterprise-input text-xs font-mono flex-1"
          >
            {certificates.map((cert) => (
              <option key={cert._id} value={cert.certificateId}>
                {cert.certificateId} — {cert.studentName} ({cert.degree}) [{cert.certificateStatus.toUpperCase()}]
              </option>
            ))}
          </select>

          <button
            onClick={handleExecuteTest}
            disabled={running}
            className="enterprise-btn-secondary text-xs shrink-0 flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-primary" />
            Run Test on Selected
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-error flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Execution Results Container */}
      {testResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Summary Banner */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-navy font-semibold">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>
                Testing Certificate <strong className="font-mono">{testResult.certificate.certificateId}</strong> ({testResult.certificate.studentName})
              </span>
            </div>
            <span className="text-[11px] text-secondary font-mono">
              Executed at {new Date(testResult.executionTimestamp).toLocaleTimeString()}
            </span>
          </div>

          {/* Side-by-Side Comparison: Original vs Tampered */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Original Untouched PDF */}
            <div className="enterprise-card overflow-hidden border-t-4 border-t-success">
              <div className="p-4 border-b border-border bg-green-50/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-green-900">
                    Phase 1: Original Genuine PDF
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                  {testResult.original.verdict}
                </span>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div>
                  <span className="text-secondary block mb-1">Original Binary File Size</span>
                  <span className="font-mono font-bold text-navy">
                    {testResult.original.fileSizeBytes.toLocaleString()} bytes
                  </span>
                </div>

                <div>
                  <span className="text-secondary block mb-1">Exact SHA-256 Digest (Computed from Bytes)</span>
                  <div className="p-2.5 bg-slate-50 border border-border rounded font-mono text-[11px] text-navy break-all">
                    {testResult.original.sha256Hex}
                  </div>
                </div>

                <div>
                  <span className="text-secondary block mb-1">Solidity bytes32 Representation</span>
                  <div className="p-2.5 bg-slate-50 border border-border rounded font-mono text-[11px] text-primary break-all">
                    {testResult.original.bytes32}
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="text-secondary block mb-1.5 font-bold uppercase text-[10px]">
                    Smart Contract Query Result
                  </span>
                  <div className="p-3 rounded-lg bg-slate-50 border border-border space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-secondary">exists:</span>
                      <span className="font-bold text-success">{String(testResult.original.contractVerification.exists)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">isValid:</span>
                      <span className="font-bold text-success">{String(testResult.original.contractVerification.isValid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">isRevoked:</span>
                      <span className="font-bold">{String(testResult.original.contractVerification.isRevoked)}</span>
                    </div>
                    {testResult.original.contractVerification.issuer && (
                      <div className="flex justify-between">
                        <span className="text-secondary">issuer:</span>
                        <span className="text-navy truncate max-w-[150px]">{testResult.original.contractVerification.issuer}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Single-Byte Tampered PDF */}
            <div className="enterprise-card overflow-hidden border-t-4 border-t-error">
              <div className="p-4 border-b border-border bg-red-50/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-error" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-red-900">
                    Phase 2: 1-Byte In-Memory Mutated PDF
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                  {testResult.tampered.verdict}
                </span>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div>
                  <span className="text-secondary block mb-1">Mutation Mechanism Executed</span>
                  <span className="font-mono font-bold text-error text-[11px]">
                    {testResult.tampered.mutationDescription}
                  </span>
                </div>

                <div>
                  <span className="text-secondary block mb-1">Mutated SHA-256 Digest (Avalanche Effect)</span>
                  <div className="p-2.5 bg-red-50/50 border border-red-200 rounded font-mono text-[11px] text-red-800 break-all font-bold">
                    {testResult.tampered.sha256Hex}
                  </div>
                </div>

                <div>
                  <span className="text-secondary block mb-1">Mutated Solidity bytes32 Representation</span>
                  <div className="p-2.5 bg-slate-50 border border-border rounded font-mono text-[11px] text-secondary break-all">
                    {testResult.tampered.bytes32}
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="text-secondary block mb-1.5 font-bold uppercase text-[10px]">
                    Smart Contract Query Result
                  </span>
                  <div className="p-3 rounded-lg bg-slate-50 border border-border space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-secondary">exists:</span>
                      <span className="font-bold text-error">{String(testResult.tampered.contractVerification.exists)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">isValid:</span>
                      <span className="font-bold text-error">{String(testResult.tampered.contractVerification.isValid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">outcome:</span>
                      <span className="font-bold text-error">REJECTED BY ON-CHAIN REGISTRY</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Proof Analysis Card */}
          <div className="enterprise-card p-6 bg-slate-50/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-2 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-primary" />
              Cryptographic Proof Verification Summary
            </h4>
            <div className="space-y-2 text-xs text-secondary leading-relaxed">
              <p>
                <strong>Avalanche Property:</strong> Inverting a single bit at offset 128 produced a completely
                unrelated 256-bit hash. Because the smart contract stores only the hash of the approved original document,
                any tampering attempt is cryptographically detectable without needing to inspect file contents.
              </p>
              <p>
                <strong>Blockchain Ledger Guarantee:</strong> The mutated hash has never been anchored by an authorized
                issuer, causing the contract's <code className="text-navy font-bold">verifyCertificate()</code> view function
                to strictly return <code className="text-error font-bold">exists = false</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
