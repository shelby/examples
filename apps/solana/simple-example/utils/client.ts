import { Network, Shelby } from "@shelby-protocol/solana-kit/node";
import { Connection } from "@solana/web3.js";

// Singleton Shelby client for server-side operations
let shelbyClient: Shelby | null = null;

export const getShelbyClient = (): Shelby => {
  if (!shelbyClient) {
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com",
    );

    shelbyClient = new Shelby({
      network: Network.SHELBYNET,
      connection,
      apiKey: process.env.SHELBY_API_KEY ?? "",
    });
  }
  return shelbyClient;
};
