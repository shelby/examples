"use client";

import {
  useWalletModal,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { memo } from "react";

interface HeaderProps {
  currentStep: number;
}

export const Header = memo(function Header({ currentStep }: HeaderProps) {
  const { visible } = useWalletModal();

  return (
    <header className="glass-neon rounded-xl mb-8 py-5 px-6 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-baseline gap-3 flex-wrap">
          <span className="font-mono bg-gradient-to-r from-neon-pink to-neon-cyan bg-clip-text text-transparent drop-shadow-[0_0_10px_oklch(0.7_0.3_340/0.5)]">
            @shelby-protocol/solana-kit
          </span>
          <span className="text-neon-pink/70 font-light select-none">
            {"//"}
          </span>
          <span className="text-foreground/90 font-normal">Simple Example</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload blobs to Shelby using your Solana wallet
        </p>
      </div>
      <div
        className={`flex items-center gap-3 ${currentStep === 0 && !visible ? "glow-pulse-container" : ""}`}
      >
        <WalletMultiButton />
      </div>
    </header>
  );
});
