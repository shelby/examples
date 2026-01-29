import { ace } from "@aptos-labs/ace-sdk";
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

/**
 * Create an ACE committee instance.
 */
export function createAceCommittee(): ace.Committee {
  return new ace.Committee({
    workerEndpoints: [...config.ace.workerEndpoints] as string[],
    threshold: config.ace.threshold,
  });
}

/**
 * Create an ACE contract ID for Solana.
 */
export function createAceContractId(): ace.ContractID {
  return ace.ContractID.newSolana({
    knownChainName: config.ace.solanaChainName,
    programId: config.programs.aceHook,
  });
}

/**
 * Encrypt the redKey into a greenBox using threshold IBE.
 * This greenBox can only be decrypted by users who have purchased access.
 */
export async function encryptRedKey(
  redKey: Uint8Array,
  fullBlobNameBytes: Uint8Array
): Promise<Uint8Array> {
  const committee = createAceCommittee();
  const contractId = createAceContractId();

  // Fetch encryption key from committee
  const encryptionKeyResult = await ace.EncryptionKey.fetch({
    committee,
  });
  const encryptionKey = encryptionKeyResult.unwrapOrThrow(
    "Failed to fetch encryption key"
  );

  // Encrypt the redKey
  const encryptResult = ace
    .encrypt({
      encryptionKey,
      contractId,
      domain: fullBlobNameBytes,
      plaintext: redKey,
    })
    .unwrapOrThrow("Failed to encrypt redKey");

  return encryptResult.ciphertext.toBytes();
}

/**
 * Decrypt the greenBox to recover the redKey using a proof-of-permission transaction.
 * @param signedTransactionBytes - Serialized signed transaction bytes (from any Solana SDK)
 */
export async function decryptGreenBox(
  greenBoxBytes: Uint8Array,
  fullBlobNameBytes: Uint8Array,
  signedTransactionBytes: Uint8Array
): Promise<Uint8Array> {
  const committee = createAceCommittee();
  const contractId = createAceContractId();

  // Reconstruct the ciphertext from bytes
  const greenBox = ace.Ciphertext.fromBytes(greenBoxBytes).unwrapOrThrow(
    "Failed to parse greenBox ciphertext"
  );

  // Create proof of permission from the signed transaction bytes
  const pop = ace.ProofOfPermission.createSolana({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    txn: signedTransactionBytes as any,
  });

  // Fetch decryption key from committee
  const decryptionKeyResult = await ace.DecryptionKey.fetch({
    committee,
    contractId,
    domain: fullBlobNameBytes,
    proof: pop,
  });
  const decryptionKey = decryptionKeyResult.unwrapOrThrow(
    "Failed to fetch decryption key"
  );

  // Decrypt the greenBox
  const plaintext = ace
    .decrypt({
      decryptionKey,
      ciphertext: greenBox,
    })
    .unwrapOrThrow("Failed to decrypt greenBox");

  return plaintext;
}
