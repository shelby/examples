"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@shelby-protocol/ui/components/button";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, Copy } from "lucide-react";
import { toast } from "sonner";

export const Header = () => {
  const { connected, account, connect, wallets, disconnect } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onFaucetAptos = () => {
    if (!account) return;
    window.open(
      `https://docs.shelby.xyz/apis/faucet/aptos?address=${account.address}`,
      "_blank"
    );
  };

  const onMintShelbyUsd = () => {
    if (!account) return;
    window.open(
      `https://docs.shelby.xyz/apis/faucet/shelbyusd?address=${account.address}`,
      "_blank",
    );
  };

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toString());
      toast.success("Address copied!");
      setIsDropdownOpen(false);
    }
  };

  return (
    <header className="border-b border-white/10 mb-8 bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="w-[90%] mx-auto flex justify-between items-center py-4">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Shelby Stream
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Faucet Buttons only visible when connected */}
          {connected && (
            <>
              <Button
                onClick={() => onFaucetAptos()}
                className="bg-blue-500/10 hover:bg-blue-500/20 !text-blue-400 hover:!text-blue-300 border border-blue-500/30 hidden sm:block"
                variant="outline"
                size="sm"
              >
                Faucet APT
              </Button>
              <Button
                onClick={() => onMintShelbyUsd()}
                className="bg-purple-500/10 hover:bg-purple-500/20 !text-purple-400 hover:!text-purple-300 border border-purple-500/30 hidden sm:block"
                variant="outline"
                size="sm"
              >
                Mint shelbyUSD
              </Button>
            </>
          )}

          {/* Custom Wallet Connection UI with Dropdown */}
          {connected && account ? (
            <div className="relative" ref={dropdownRef}>
              <Button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white border-white/10 transition-colors"
                size="sm"
              >
                <span className="font-mono text-xs sm:text-sm">
                  {account.address.toString().slice(0, 6)}...{account.address.toString().slice(-4)}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-1">
                    <button
                      onClick={copyAddress}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-left"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Address
                    </button>
                    <div className="h-px bg-white/10 my-1" />
                    <button
                      onClick={() => {
                        disconnect();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {wallets.length > 0 && (() => {
                const preferredWallet = wallets.find(w => w.name.toLowerCase().includes('petra')) || wallets[0];
                return (
                  <Button
                    key={preferredWallet.name}
                    onClick={() => connect(preferredWallet.name)}
                    className="bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/20"
                    size="sm"
                  >
                    Connect Wallet
                  </Button>
                );
              })()}
              {wallets.length === 0 && (
                <Button onClick={() => window.open("https://petra.app/", "_blank")} size="sm">
                  Install Wallet
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
