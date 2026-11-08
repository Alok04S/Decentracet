import React, { useState, useEffect } from "react";
import { Boxes, ExternalLink, Copy, Check, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";

export const BlockchainTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/blockchain/transactions");
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.error("Fetch transactions error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Blockchain Ledger Transactions</h1>
          <p className="text-xs text-secondary mt-1">
            Genuine transaction records confirmed on Ethereum Sepolia or local Hardhat network.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="enterprise-btn-secondary text-xs flex items-center gap-1.5 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Ledger
        </button>
      </div>

      <div className="enterprise-card overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Querying confirmed blockchain transactions..." />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No Confirmed Blockchain Transactions Found"
            description="When credentials are confirmed on Ethereum Sepolia or the local Hardhat node, their mined block numbers and transaction hashes will appear here automatically."
            icon={Boxes}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border text-secondary">
                <tr>
                  <th className="py-3 px-4 font-semibold">Certificate ID</th>
                  <th className="py-3 px-4 font-semibold">Transaction Type</th>
                  <th className="py-3 px-4 font-semibold">Transaction Hash</th>
                  <th className="py-3 px-4 font-semibold">Block Number</th>
                  <th className="py-3 px-4 font-semibold">Issuer Address</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-[11px]">
                {transactions.map((tx, idx) => (
                  <tr key={`${tx.transactionHash}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-navy font-mono">
                      <Link to={`/verify/${tx.certificateId}`} target="_blank" className="text-primary hover:underline">
                        {tx.certificateId}
                      </Link>
                    </td>

                    <td className="py-3 px-4 font-sans font-semibold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === "CERTIFICATE_ISSUANCE"
                            ? "bg-blue-100 text-primary"
                            : "bg-red-100 text-error"
                        }`}
                      >
                        {tx.type === "CERTIFICATE_ISSUANCE" ? "ISSUANCE" : "REVOCATION"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-navy">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[160px]">{tx.transactionHash}</span>
                        <button
                          onClick={() => handleCopy(tx.transactionHash)}
                          className="text-secondary hover:text-navy p-0.5 rounded"
                          title="Copy Transaction Hash"
                        >
                          {copiedHash === tx.transactionHash ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-secondary">
                      {tx.blockNumber ? `#${tx.blockNumber}` : "Mined"}
                    </td>

                    <td className="py-3 px-4 text-secondary truncate max-w-[120px]">
                      {tx.issuerAddress || "Registry Signer"}
                    </td>

                    <td className="py-3 px-4 text-secondary font-sans text-xs">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-sans">
                      {tx.etherscanUrl ? (
                        <a
                          href={tx.etherscanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                        >
                          Sepolia Etherscan <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">Hardhat Local</span>
                      )}
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
