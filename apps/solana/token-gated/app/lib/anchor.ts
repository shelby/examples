import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import {
  type Address,
  getAddressEncoder,
  getProgramDerivedAddress,
} from "@solana/kit";
import { Connection, PublicKey } from "@solana/web3.js";
import accessControlIdl from "../../anchor/target/idl/access_control.json";
import aceHookIdl from "../../anchor/target/idl/ace_hook.json";
import type { AccessControl } from "../../anchor/target/types/access_control";
import type { AceHook } from "../../anchor/target/types/ace_hook";
import { config, GREEN_BOX_SCHEME } from "./config";

// ============================================================================
// Anchor Program Helpers
// ============================================================================

/**
 * Create an Anchor provider with a mock wallet for encoding instructions.
 * The wallet is only used for account resolution, not actual signing.
 */
function createEncodingProvider(signerPubkey?: PublicKey): AnchorProvider {
  const connection = new Connection(config.solanaRpcUrl, "confirmed");

  // Create a mock wallet that satisfies Anchor's requirements
  const mockWallet = {
    publicKey: signerPubkey ?? PublicKey.default,
    signTransaction: async () => {
      throw new Error("Not implemented");
    },
    signAllTransactions: async () => {
      throw new Error("Not implemented");
    },
  };

  return new AnchorProvider(connection, mockWallet as never, {
    commitment: "confirmed",
  });
}

/**
 * Get the AccessControl program instance for encoding/fetching
 */
function getAccessControlProgram(
  signerPubkey?: PublicKey
): Program<AccessControl> {
  return new Program<AccessControl>(
    accessControlIdl as AccessControl,
    createEncodingProvider(signerPubkey)
  );
}

/**
 * Get the AceHook program instance for encoding/fetching
 */
function getAceHookProgram(signerPubkey?: PublicKey): Program<AceHook> {
  return new Program<AceHook>(
    aceHookIdl as AceHook,
    createEncodingProvider(signerPubkey)
  );
}

// ============================================================================
// PDA Derivations
// ============================================================================

/**
 * Derive the blob metadata PDA for a given owner and blob name.
 * Seeds must be raw bytes (no length prefix) to match Anchor's PDA derivation.
 */
export async function deriveBlobMetadataPda(
  storageAccountAddressBytes: Uint8Array,
  blobName: string
): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: config.programs.accessControl,
    seeds: [
      new TextEncoder().encode("blob_metadata"),
      storageAccountAddressBytes,
      new TextEncoder().encode(blobName),
    ],
  });
  return pda;
}

/**
 * Derive the access receipt PDA for a given owner, blob name, and buyer.
 * Seeds must be raw bytes (no length prefix) to match Anchor's PDA derivation.
 */
export async function deriveAccessReceiptPda(
  storageAccountAddressBytes: Uint8Array,
  blobName: string,
  buyerAddress: Address
): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: config.programs.accessControl,
    seeds: [
      new TextEncoder().encode("access"),
      storageAccountAddressBytes,
      new TextEncoder().encode(blobName),
      getAddressEncoder().encode(buyerAddress),
    ],
  });
  return pda;
}

/**
 * Check if a user has already purchased access to a blob.
 * Returns true if the receipt account exists on-chain.
 */
export async function checkHasPurchased(
  storageAccountAddressBytes: Uint8Array,
  blobName: string,
  buyerAddress: Address
): Promise<boolean> {
  const receiptPda = await deriveAccessReceiptPda(
    storageAccountAddressBytes,
    blobName,
    buyerAddress
  );
  const connection = new Connection(config.solanaRpcUrl, "confirmed");
  const accountInfo = await connection.getAccountInfo(
    new PublicKey(receiptPda)
  );
  return accountInfo !== null;
}

// ============================================================================
// Instruction Data Encoders (using Anchor for type-safe encoding)
// ============================================================================

/**
 * Encode the register_blob instruction data using Anchor.
 * @param signerAddress - The signer's Solana address (used for account resolution)
 */
export async function encodeRegisterBlobData(
  storageAccountAddress: Uint8Array,
  blobName: string,
  greenBoxScheme: number,
  greenBoxBytes: Uint8Array,
  price: bigint,
  signerAddress: Address
): Promise<Uint8Array> {
  const signerPubkey = new PublicKey(signerAddress);
  const program = getAccessControlProgram(signerPubkey);

  // Build the instruction using Anchor's type-safe methods builder
  const ix = await program.methods
    .registerBlob(
      Array.from(storageAccountAddress) as number[],
      blobName,
      greenBoxScheme,
      Buffer.from(greenBoxBytes),
      new BN(price.toString())
    )
    .instruction();

  return new Uint8Array(ix.data);
}

/**
 * Encode the purchase instruction data using Anchor.
 * @param signerAddress - The buyer's Solana address (the signer)
 * @param ownerSolanaAddress - The seller's Solana address (receives SOL)
 */
export async function encodePurchaseData(
  storageAccountAddress: Uint8Array,
  blobName: string,
  signerAddress: Address,
  ownerSolanaAddress: Address
): Promise<Uint8Array> {
  const signerPubkey = new PublicKey(signerAddress);
  const ownerPubkey = new PublicKey(ownerSolanaAddress);
  const program = getAccessControlProgram(signerPubkey);

  // Build the instruction using Anchor's type-safe methods builder
  // We must provide the `owner` account explicitly since Anchor can't auto-resolve it
  const ix = await program.methods
    .purchase(Array.from(storageAccountAddress) as number[], blobName)
    .accounts({
      owner: ownerPubkey,
    })
    .instruction();

  return new Uint8Array(ix.data);
}

/**
 * Encode the assert_access instruction data using Anchor.
 * @param signerAddress - The user's Solana address (the signer)
 * @param blobMetadataPda - The blob metadata PDA
 * @param receiptPda - The access receipt PDA
 */
export async function encodeAssertAccessData(
  fullBlobNameBytes: Uint8Array,
  signerAddress: Address,
  blobMetadataPda: Address,
  receiptPda: Address
): Promise<Uint8Array> {
  const signerPubkey = new PublicKey(signerAddress);
  const program = getAceHookProgram(signerPubkey);

  // Build the instruction using Anchor's type-safe methods builder
  // We must provide accounts explicitly since Anchor can't auto-resolve them
  const ix = await program.methods
    .assertAccess(Buffer.from(fullBlobNameBytes))
    .accounts({
      blobMetadata: new PublicKey(blobMetadataPda),
      receipt: new PublicKey(receiptPda),
    })
    .instruction();

  return new Uint8Array(ix.data);
}

// ============================================================================
// On-chain fetch helpers
// ============================================================================

export interface BlobMetadataAccount {
  owner: Address;
  greenBoxScheme: number;
  greenBoxBytes: Uint8Array;
  seqnum: bigint;
  price: bigint;
}

/**
 * Fetch and decode the blob_metadata account from Solana using Anchor.
 */
export async function fetchBlobMetadata(
  storageAccountAddressBytes: Uint8Array,
  blobName: string
): Promise<{
  owner: Address;
  greenBoxBytes: Uint8Array;
  price: bigint;
  seqnum: bigint;
}> {
  const program = getAccessControlProgram();

  // Derive PDA using @solana/kit (consistent with rest of codebase)
  const pda = await deriveBlobMetadataPda(storageAccountAddressBytes, blobName);

  // Fetch account using Anchor - auto-deserializes the data
  const metadata = await program.account.blobMetadata.fetch(new PublicKey(pda));

  if (metadata.greenBoxScheme !== GREEN_BOX_SCHEME) {
    throw new Error(`Unsupported green_box_scheme: ${metadata.greenBoxScheme}`);
  }

  return {
    owner: metadata.owner.toBase58() as Address,
    greenBoxBytes: Buffer.from(metadata.greenBoxBytes),
    price: BigInt(metadata.price.toString()),
    seqnum: BigInt(metadata.seqnum.toString()),
  };
}
