"use client";

import { toast } from "@shelby-protocol/ui/components";
import { Button } from "@shelby-protocol/ui/components/button";
import { Input } from "@shelby-protocol/ui/components/input";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair } from "@solana/web3.js";
import { memo, useCallback, useEffect, useState } from "react";
import { useCreateStorageAccount } from "@/hooks/useCreateStorageAccount";
import { useFundAccount } from "@/hooks/useFundAccount";

function handleFundingError(errorMessage: string): void {
  toast.error(errorMessage);
}

interface StorageAccountManagerProps {
  currentStep: number;
  onStorageAccountCreated?: (
    keypair: Keypair,
    domain: string,
    address: string,
  ) => void;
  onAccountFunded?: () => void;
  onKeypairReset?: () => void;
}

export const StorageAccountManager = memo(function StorageAccountManager({
  currentStep,
  onStorageAccountCreated,
  onAccountFunded,
  onKeypairReset,
}: StorageAccountManagerProps) {
  const { connected } = useWallet();
  const { createStorageAccount, isCreating } = useCreateStorageAccount();
  const { fundAccount, isFunding } = useFundAccount();

  const [domain, setDomain] = useState("shelby-loves-solana.com");
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [storageAccountAddress, setStorageAccountAddress] = useState<
    string | null
  >(null);
  const [isFunded, setIsFunded] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Generate a new keypair on mount
  useEffect(() => {
    setKeypair(Keypair.generate());
  }, []);

  const handleCreateStorageAccount = useCallback(async () => {
    if (!keypair || !domain) return;

    try {
      setStatusMessage("Creating storage account...");
      const result = await createStorageAccount(keypair.secretKey, domain);
      setStorageAccountAddress(result.storageAccountAddress);
      setStatusMessage(null);
      toast.success("Storage account created!");
      onStorageAccountCreated?.(keypair, domain, result.storageAccountAddress);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setStatusMessage(null);
      toast.error(`Failed to create storage account: ${errorMessage}`);
    }
  }, [keypair, domain, createStorageAccount, onStorageAccountCreated]);

  const handleFundAccount = useCallback(async () => {
    if (!keypair || !domain) return;

    try {
      setStatusMessage("Funding account with ShelbyUSD and APT...");
      await fundAccount(
        keypair.secretKey,
        domain,
        1_000_000_000, // 1 ShelbyUSD
        1_000_000_000, // 1 APT
      );
      setIsFunded(true);
      setStatusMessage(null);
      toast.success("Account funded successfully!");
      onAccountFunded?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setStatusMessage(null);
      handleFundingError(errorMessage);
    }
  }, [keypair, domain, fundAccount, onAccountFunded]);

  const handleGenerateNewKeypair = useCallback(() => {
    setKeypair(Keypair.generate());
    setStorageAccountAddress(null);
    setIsFunded(false);
    setStatusMessage(null);
    onKeypairReset?.();
  }, [onKeypairReset]);

  if (!connected) {
    return (
      <div className="glass-neon rounded-xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Storage Account
        </h2>
        <p className="text-muted-foreground">
          Connect your Solana wallet to create a storage account.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-neon rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Storage Account
        </h2>
        <p className="text-sm text-muted-foreground">
          Create and fund a Shelby storage account derived from a Solana
          keypair.
        </p>
      </div>

      {/* Keypair Info */}
      <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">
            Solana Keypair
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateNewKeypair}
          >
            Generate New
          </Button>
        </div>
        {keypair && (
          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted-foreground">Public Key:</span>
              <p className="text-sm font-mono break-all">
                {keypair.publicKey.toBase58()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Domain Input */}
      <div className="space-y-2">
        <label
          htmlFor="domain"
          className="text-sm font-medium text-muted-foreground"
        >
          Domain
        </label>
        <Input
          id="domain"
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="my-awesome-dapp.com"
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          The domain identifies your storage account namespace.
        </p>
      </div>

      {/* Storage Account Address */}
      {storageAccountAddress && (
        <div className="relative space-y-2 p-4 bg-success/10 rounded-lg border border-success/30">
          <span className="text-sm font-medium text-success">
            Storage Account Address
          </span>
          <p className="text-sm font-mono break-all">{storageAccountAddress}</p>
          {isFunded && (
            <span className="absolute top-3 right-3 inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-success/20 text-success">
              Funded
            </span>
          )}
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <p
          className={`text-sm ${statusMessage.startsWith("Error") ? "text-destructive" : "text-muted-foreground"}`}
        >
          {statusMessage}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleCreateStorageAccount}
          disabled={
            isCreating || !keypair || !domain || !!storageAccountAddress
          }
          className={`flex-1 ${currentStep === 1 ? "glow-pulse" : ""}`}
        >
          {isCreating ? "Creating..." : "Create Storage Account"}
        </Button>
        <Button
          onClick={handleFundAccount}
          disabled={isFunding || !storageAccountAddress || isFunded}
          variant="outline"
          className={`flex-1 ${currentStep === 2 ? "glow-pulse" : ""}`}
        >
          {isFunding ? "Funding..." : "Fund Account"}
        </Button>
      </div>
    </div>
  );
});
