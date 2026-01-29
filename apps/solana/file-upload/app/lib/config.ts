/**
 * Configuration for the Solana file upload app.
 */
export const config = {
  // Solana RPC endpoint
  solanaRpcUrl:
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.testnet.solana.com",
} as const;
