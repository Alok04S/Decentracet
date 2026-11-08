import React, { useState } from "react";
import { X, Copy, Check, Download, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface QrModalProps {
  isOpen: boolean;
  certificateId: string;
  studentName: string;
  onClose: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  certificateId,
  studentName,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const verificationUrl = `${window.location.origin}/verify/${encodeURIComponent(certificateId)}`;
  const qrImageUrl = `/api/certificates/${encodeURIComponent(certificateId)}/qr`;

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    const a = document.createElement("a");
    a.href = qrImageUrl;
    a.download = `${certificateId}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-xs">
      <div className="bg-surface border border-border rounded-xl shadow-elevated max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-navy">Public Verification QR Code</h3>
          <button
            onClick={onClose}
            className="text-secondary hover:text-navy p-1 rounded-md hover:bg-slate-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-slate-50 border border-border rounded-xl inline-block mb-3 shadow-inner">
          <img
            src={qrImageUrl}
            alt={`QR code for ${certificateId}`}
            className="w-48 h-48 mx-auto object-contain bg-white p-2 rounded-lg"
          />
        </div>

        <div className="text-xs font-bold text-navy mb-0.5">{certificateId}</div>
        <p className="text-[11px] text-secondary mb-4 truncate">{studentName}</p>

        {/* URL Box */}
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-border text-left mb-4">
          <span className="text-[11px] font-mono text-secondary truncate flex-1 select-all">
            {verificationUrl}
          </span>
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-slate-200 text-secondary hover:text-navy transition-colors shrink-0"
            title="Copy URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownloadQr}
            className="enterprise-btn-secondary text-xs py-2 w-full flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>

          <Link
            to={`/verify/${certificateId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="enterprise-btn-primary text-xs py-2 w-full flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Link
          </Link>
        </div>
      </div>
    </div>
  );
};
