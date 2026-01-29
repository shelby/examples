import { config } from "./config";

// ============================================================================
// AES-GCM Encryption (for file content - the "redBox")
// ============================================================================

const IV_LENGTH = 12; // 96 bits for AES-GCM

/** Helper to convert Uint8Array to ArrayBuffer for Web Crypto API */
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(
    arr.byteOffset,
    arr.byteOffset + arr.byteLength
  ) as ArrayBuffer;
}

/**
 * Generate a random 256-bit key for AES-GCM encryption.
 */
export function generateRedKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Encrypt file content with AES-GCM using the provided key.
 * Returns: IV (12 bytes) || ciphertext
 */
export async function encryptFile(
  plaintext: Uint8Array,
  redKey: Uint8Array
): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(redKey),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    toArrayBuffer(plaintext)
  );

  // Prepend IV to ciphertext
  const result = new Uint8Array(iv.length + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), iv.length);

  return result;
}

/**
 * Decrypt file content with AES-GCM.
 * Input format: IV (12 bytes) || ciphertext
 */
export async function decryptFile(
  redBox: Uint8Array,
  redKey: Uint8Array
): Promise<Uint8Array> {
  const iv = redBox.slice(0, IV_LENGTH);
  const ciphertext = redBox.slice(IV_LENGTH);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(redKey),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    toArrayBuffer(ciphertext)
  );

  return new Uint8Array(plaintext);
}

// ============================================================================
// ACE Threshold IBE (for key encryption - the "greenBox")
// ============================================================================
// NOTE: These functions are placeholders. The @aptos-labs/ace-sdk package
// is not available in npm registry. Implement these with an alternative
// threshold encryption library or restore when the package is available.

/**
 * Create an ACE committee instance.
 * @deprecated - Package @aptos-labs/ace-sdk not available in npm registry
 */
export function createAceCommittee() {
  throw new Error("ACE committee functionality is not available. @aptos-labs/ace-sdk package is not in npm registry.");
}

/**
 * Create an ACE contract ID for Solana.
 * @deprecated - Package @aptos-labs/ace-sdk not available in npm registry
 */
export function createAceContractId() {
  throw new Error("ACE contract ID functionality is not available. @aptos-labs/ace-sdk package is not in npm registry.");
}

/**
 * Encrypt the redKey into a greenBox using threshold IBE.
 * This greenBox can only be decrypted by users who have purchased access.
 * @deprecated - Package @aptos-labs/ace-sdk not available in npm registry
 */
export async function encryptRedKey(
  redKey: Uint8Array,
  fullBlobNameBytes: Uint8Array
): Promise<Uint8Array> {
  throw new Error("ACE encryption functionality is not available. @aptos-labs/ace-sdk package is not in npm registry.");
}

/**
 * Decrypt the greenBox to recover the redKey using a proof-of-permission transaction.
 * @param signedTransactionBytes - Serialized signed transaction bytes (from any Solana SDK)
 * @deprecated - Package @aptos-labs/ace-sdk not available in npm registry
 */
export async function decryptGreenBox(
  greenBoxBytes: Uint8Array,
  fullBlobNameBytes: Uint8Array,
  signedTransactionBytes: Uint8Array
): Promise<Uint8Array> {
  throw new Error("ACE decryption functionality is not available. @aptos-labs/ace-sdk package is not in npm registry.");
}
