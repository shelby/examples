"use client";

import { autoDiscover, createClient } from "@solana/client";
import { SolanaProvider } from "@solana/react-hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "../lib/config";

// Filter to only show wallets that support Solana features
const isSolanaWallet = (wallet: { features: Record<string, unknown> }) => {
  return Object.keys(wallet.features).some((feature) =>
    feature.startsWith("solana:"),
  );
};

const client = createClient({
  endpoint: config.solanaRpcUrl,
  walletConnectors: autoDiscover({ filter: isSolanaWallet }),
});

const queryClient = new QueryClient();

export function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryClientProvider client={queryClient}>
      <SolanaProvider client={client}>{children}</SolanaProvider>
    </QueryClientProvider>
  );
}
