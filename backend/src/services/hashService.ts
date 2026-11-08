import crypto from "crypto";

export interface HashResult {
  hexSha256: string; // 64-char lowercase hex string
  bytes32: string;   // 0x-prefixed 66-char string
}

/**
 * Calculates the exact byte-level SHA-256 hash of a file or buffer.
 * Ensures consistent bytes32 format for Ethereum smart contract interactions.
 */
export function calculatePdfSha256(buffer: Buffer | Uint8Array): HashResult {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex").toLowerCase();
  const bytes32 = `0x${hash}`;
  return {
    hexSha256: hash,
    bytes32,
  };
}

/**
 * Verifies if a given string is a valid 32-byte hexadecimal representation (0x + 64 hex characters).
 */
export function isValidBytes32(hash: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(hash);
}

/**
 * Normalizes any hex string or 0x-prefixed string to standard 0x bytes32 format.
 */
export function toBytes32(hash: string): string {
  const clean = hash.trim().toLowerCase().replace(/^0x/, "");
  if (clean.length !== 64) {
    throw new Error(`Invalid SHA-256 length: expected 64 hex characters, received ${clean.length}`);
  }
  return `0x${clean}`;
}
