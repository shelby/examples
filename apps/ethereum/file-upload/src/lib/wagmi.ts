import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

// Configure wallets - only browser extensions, no WalletConnect
const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [metaMaskWallet, coinbaseWallet, injectedWallet],
    },
  ],
  {
    appName: "Shelby File Upload",
    projectId: "none", // Not using WalletConnect
  },
);

export const config = createConfig({
  connectors,
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true, // Enable SSR support for Next.js
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
