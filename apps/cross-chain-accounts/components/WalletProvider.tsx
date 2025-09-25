"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PropsWithChildren } from "react";
import { Network } from "@aptos-labs/ts-sdk";
import { setupAutomaticSolanaWalletDerivation } from "@aptos-labs/derived-wallet-solana";
import { setupAutomaticEthereumWalletDerivation } from "@aptos-labs/derived-wallet-ethereum";

setupAutomaticSolanaWalletDerivation({ defaultNetwork: Network.DEVNET });
setupAutomaticEthereumWalletDerivation({ defaultNetwork: Network.DEVNET });

export const WalletProvider = ({ children }: PropsWithChildren) => {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.DEVNET,
        aptosApiKeys: {
          devnet: process.env.APTOS_API_KEY_DEVNET,
        },
      }}
      onError={(error) => {
        console.log("error", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};
