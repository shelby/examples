"use client";

import { useStorageAccount } from "@shelby-protocol/solana-kit/react";
import { useWalletConnection } from "@solana/react-hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { shelbyClient } from "../lib/shelbyClient";

function formatAddress(address?: string) {
  if (!address) return "Not connected";
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function WalletButton() {
  const { connectors, connect, disconnect, wallet, status } =
    useWalletConnection();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const walletAddress = wallet?.account.address.toString();

  // Storage account derived from the connected wallet (using new API)
  const { storageAccountAddress } = useStorageAccount({
    client: shelbyClient,
    wallet,
  });

  // Close modal when connection succeeds
  useEffect(() => {
    if (status === "connected") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsModalOpen(false);
    }
  }, [status]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const buttonLabel = useMemo(
    () =>
      status === "connected"
        ? formatAddress(walletAddress)
        : status === "connecting"
          ? "Connecting..."
          : "Connect wallet",
    [status, walletAddress],
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() =>
          status === "connected"
            ? setIsMenuOpen((v) => !v)
            : setIsModalOpen(true)
        }
        className="inline-flex items-center gap-2 rounded-full border border-border-low bg-card px-4 py-2 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <span className="h-2 w-2 rounded-full bg-foreground/70" aria-hidden />
        <span>{buttonLabel}</span>
      </button>

      {isMenuOpen && status === "connected" && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border-low bg-card shadow-lg z-50 overflow-hidden">
          {/* Storage Account */}
          <div className="px-4 py-3">
            <div className="text-sm font-medium mb-1">Storage account</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-muted">
                {storageAccountAddress
                  ? `${storageAccountAddress.toString().slice(0, 6)}...${storageAccountAddress.toString().slice(-5)}`
                  : "Not available"}
              </span>
              <button
                onClick={() => {
                  if (storageAccountAddress) {
                    navigator.clipboard.writeText(
                      storageAccountAddress.toString(),
                    );
                  }
                }}
                className="p-1.5 rounded hover:bg-foreground/10 transition text-muted hover:text-foreground"
                title="Copy address"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Disconnect */}
          <div className="px-4 py-3 border-t border-border-low">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                disconnect();
              }}
              className="text-sm font-medium hover:opacity-70 transition"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {isModalOpen &&
        status !== "connected" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="w-full max-w-md mx-4 rounded-2xl border border-border-low bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-lg font-semibold">Select a wallet</p>
                  <p className="text-sm text-muted">
                    Choose any discovered connector to continue.
                  </p>
                </div>
                <button
                  className="text-sm text-muted hover:text-foreground transition"
                  onClick={() => setIsModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="grid gap-3">
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => connect(connector.id)}
                    disabled={status === "connecting"}
                    className="group flex items-center justify-between rounded-xl border border-border-low bg-card px-4 py-3 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex flex-col">
                      <span className="text-base">{connector.name}</span>
                      <span className="text-xs text-muted">
                        {status === "connecting"
                          ? "Connecting…"
                          : "Tap to connect"}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full bg-border-low transition group-hover:bg-primary/80"
                    />
                  </button>
                ))}

                {connectors.length === 0 && (
                  <div className="rounded-lg border border-border-low bg-cream/40 px-4 py-3 text-sm text-muted">
                    No wallets discovered. Ensure a Solana wallet extension is
                    installed.
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
