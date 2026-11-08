import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { ENV } from "./env";

interface ContractArtifact {
  address: string;
  network: string;
  chainId: number;
  abi: any[];
}

let artifact: ContractArtifact | null = null;
const artifactPath = path.resolve(__dirname, "./contractArtifact.json");

if (fs.existsSync(artifactPath)) {
  try {
    artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  } catch (err) {
    console.warn("⚠️ Failed to read contractArtifact.json", err);
  }
}

export interface NetworkHealth {
  connected: boolean;
  networkName: string;
  chainId: number | null;
  expectedChainId: number;
  contractAddress: string;
  isContractDeployed: boolean;
  latestBlock: number | null;
  errorMessage?: string;
}

export class BlockchainClient {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private readOnlyContract: ethers.Contract | null = null;

  constructor() {
    this.initialize();
  }

  public initialize(): void {
    try {
      if (!ENV.RPC_URL) {
        return;
      }

      // Configure staticNetwork to prevent background polling retry loops when node is offline
      const network = new ethers.Network(
        ENV.CHAIN_ID === 11155111 ? "sepolia" : ENV.CHAIN_ID === 31337 ? "localhost" : "custom",
        ENV.CHAIN_ID
      );

      this.provider = new ethers.JsonRpcProvider(ENV.RPC_URL, network, {
        staticNetwork: true,
        batchMaxCount: 1,
      });

      const contractAddress = ENV.CONTRACT_ADDRESS || artifact?.address || "";
      const abi = artifact?.abi || [
        "function issueCertificate(bytes32 _certificateHash) external",
        "function revokeCertificate(bytes32 _certificateHash, string calldata _reason) external",
        "function verifyCertificate(bytes32 _certificateHash) external view returns (bool exists, bool isValid, bool isRevoked, address issuer, uint256 issuedAt)",
        "function getCertificateDetails(bytes32 _certificateHash) external view returns (tuple(bytes32 certificateHash, address issuer, uint256 issuedAt, bool revoked, uint256 revokedAt, string revocationReason))",
        "function isCertificateRevoked(bytes32 _certificateHash) external view returns (bool)",
        "function totalIssued() external view returns (uint256)",
        "function totalRevoked() external view returns (uint256)",
      ];

      if (contractAddress && ethers.isAddress(contractAddress)) {
        this.readOnlyContract = new ethers.Contract(contractAddress, abi, this.provider);

        if (ENV.PRIVATE_KEY) {
          const formattedKey = ENV.PRIVATE_KEY.startsWith("0x") ? ENV.PRIVATE_KEY : `0x${ENV.PRIVATE_KEY}`;
          this.signer = new ethers.Wallet(formattedKey, this.provider);
          this.contract = new ethers.Contract(contractAddress, abi, this.signer);
        }
      }
    } catch (err: any) {
      // Graceful fallback
    }
  }

  public async getHealth(): Promise<NetworkHealth> {
    const contractAddress = ENV.CONTRACT_ADDRESS || artifact?.address || "";

    if (!this.provider) {
      return {
        connected: false,
        networkName: "Unknown",
        chainId: null,
        expectedChainId: ENV.CHAIN_ID,
        contractAddress,
        isContractDeployed: false,
        latestBlock: null,
        errorMessage: "RPC provider not configured",
      };
    }

    try {
      const [network, latestBlock] = await Promise.all([
        this.provider.getNetwork(),
        this.provider.getBlockNumber(),
      ]);

      const chainId = Number(network.chainId);
      let isContractDeployed = false;

      if (contractAddress && ethers.isAddress(contractAddress)) {
        const code = await this.provider.getCode(contractAddress);
        isContractDeployed = code !== "0x" && code.length > 2;
      }

      return {
        connected: true,
        networkName: chainId === 11155111 ? "Ethereum Sepolia" : chainId === 31337 ? "Hardhat Local" : network.name,
        chainId,
        expectedChainId: ENV.CHAIN_ID,
        contractAddress,
        isContractDeployed,
        latestBlock,
      };
    } catch (error: any) {
      return {
        connected: false,
        networkName: "Unavailable",
        chainId: null,
        expectedChainId: ENV.CHAIN_ID,
        contractAddress,
        isContractDeployed: false,
        latestBlock: null,
        errorMessage: error.message || "Failed to reach RPC node",
      };
    }
  }

  public async validateDeployment(): Promise<{ valid: boolean; reason?: string }> {
    const health = await this.getHealth();
    if (!health.connected) {
      return { valid: false, reason: `Blockchain RPC unavailable: ${health.errorMessage}` };
    }
    if (health.chainId !== health.expectedChainId) {
      return {
        valid: false,
        reason: `Chain ID mismatch: connected to ${health.chainId}, expected ${health.expectedChainId}`,
      };
    }
    if (!health.isContractDeployed) {
      return {
        valid: false,
        reason: `No smart contract bytecode found at address ${health.contractAddress}`,
      };
    }
    return { valid: true };
  }

  public getContract(): ethers.Contract | null {
    return this.contract;
  }

  public getReadOnlyContract(): ethers.Contract | null {
    return this.readOnlyContract;
  }

  public getProvider(): ethers.JsonRpcProvider | null {
    return this.provider;
  }

  public getSigner(): ethers.Wallet | null {
    return this.signer;
  }
}

export const blockchainClient = new BlockchainClient();
