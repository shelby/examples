"use client";

import Link from "next/link";
import { WalletButton } from "./wallet-button";

export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border-low bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="h-8 w-8 rounded-lg bg-foreground text-background grid place-items-center text-sm">
            FU
          </span>
          <span className="tracking-tight">File Upload</span>
        </Link>
        <WalletButton />
      </div>
    </header>
  );
}
