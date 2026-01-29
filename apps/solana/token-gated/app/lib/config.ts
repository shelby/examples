import type { Address } from "@solana/kit";

/**
 * Configuration for the token-gated access control dapp.
 *
 * Program IDs default to deployed testnet addresses.
 * Override via environment variables for custom deployments.
 */
export const config = {
  // Solana RPC endpoint (used for reading blob metadata)
  solanaRpcUrl:
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.testnet.solana.com",

  // Solana programs
  programs: {
    /** Access control program - handles blob registration and purchases */
    accessControl: (process.env.NEXT_PUBLIC_ACCESS_CONTROL_PROGRAM_ID ||
      "Ej2KamzNByfcYEkkbx9TT5RCqbKgkmvQ5NCC7rPyyzxq") as Address,
    /** ACE hook program - verifies access for decryption */
    aceHook: (process.env.NEXT_PUBLIC_ACE_HOOK_PROGRAM_ID ||
      "3eQcE44r9fPmNVbfQtZrwZmRWsifjouHRaxmRKgshEND") as Address,
  },

  // ACE threshold decryption committee
  ace: {
    /** Worker endpoints for threshold IBE (filter out empty values) */
    workerEndpoints:
      [
        process.env.NEXT_PUBLIC_ACE_WORKER_0,
        process.env.NEXT_PUBLIC_ACE_WORKER_1,
      ].filter((url): url is string => !!url).length > 0
        ? [
            process.env.NEXT_PUBLIC_ACE_WORKER_0,
            process.env.NEXT_PUBLIC_ACE_WORKER_1,
          ].filter((url): url is string => !!url)
        : [
            "https://ace-worker-0-646682240579.europe-west1.run.app",
            "https://ace-worker-1-646682240579.europe-west1.run.app",
          ],
    /** Threshold for decryption (number of workers needed) */
    threshold: Number.parseInt(
      process.env.NEXT_PUBLIC_ACE_THRESHOLD || "2",
      10
    ),
    /** Solana chain name for ACE contract ID */
    solanaChainName: (process.env.NEXT_PUBLIC_ACE_CHAIN_NAME || "testnet") as
      | "mainnet-beta"
      | "testnet"
      | "devnet"
      | "localnet",
  },

  // Shelby storage
  shelby: {
    /** Seller account address to browse files from (Aptos/Shelby address) */
    sellerAccount: process.env.NEXT_PUBLIC_SELLER_ACCOUNT || "",
  },

  // Default pricing
  pricing: {
    /** Default price in SOL (string for input binding) */
    defaultPriceSol: "0.0005",
  },
} as const;

export const LAMPORTS_PER_SOL = 1_000_000_000n;
export const SYSTEM_PROGRAM_ADDRESS =
  "11111111111111111111111111111111" as Address;

/**
 * Green box encryption scheme for threshold IBE.
 * This is the protocol-level scheme ID expected by the on-chain program.
 */
export const GREEN_BOX_SCHEME = 2;
