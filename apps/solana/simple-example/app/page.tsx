"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import type { Keypair } from "@solana/web3.js";
import { useState } from "react";
import { BlobUploader } from "@/components/BlobUploader";
import { Header } from "@/components/Header";
import { HowItWorks } from "@/components/HowItWorks";
import { StorageAccountManager } from "@/components/StorageAccountManager";
import { YouWinOverlay } from "@/components/YouWinOverlay";

export default function Home() {
  const { connected } = useWallet();
  const [activeKeypair, setActiveKeypair] = useState<Keypair | null>(null);
  const [activeDomain, setActiveDomain] = useState<string>(
    "my-awesome-dapp.com",
  );
  const [storageAccountAddress, setStorageAccountAddress] = useState<
    string | null
  >(null);
  const [isFunded, setIsFunded] = useState(false);
  const [hasUploadedBlob, setHasUploadedBlob] = useState(false);
  const [showYouWin, setShowYouWin] = useState(false);

  // Calculate current step for glow guidance
  const completedSteps = [
    connected,
    storageAccountAddress !== null,
    isFunded,
    hasUploadedBlob,
  ];
  const currentStep = completedSteps.findIndex((c) => !c); // -1 when all complete

  const handleStorageAccountCreated = (
    keypair: Keypair,
    domain: string,
    address: string,
  ) => {
    setActiveKeypair(keypair);
    setActiveDomain(domain);
    setStorageAccountAddress(address);
    setIsFunded(false);
    setHasUploadedBlob(false);
  };

  const handleAccountFunded = () => {
    setIsFunded(true);
  };

  const handleKeypairReset = () => {
    setStorageAccountAddress(null);
    setIsFunded(false);
    setHasUploadedBlob(false);
  };

  const handleFirstBlobUploaded = () => {
    setHasUploadedBlob(true);
    setShowYouWin(true);
  };

  const handleYouWinComplete = () => {
    setShowYouWin(false);
  };

  return (
    <div className="min-h-screen p-5">
      <YouWinOverlay show={showYouWin} onComplete={handleYouWinComplete} />
      <Header currentStep={currentStep} />

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* How It Works Section */}
          <HowItWorks
            isWalletConnected={connected}
            hasStorageAccount={storageAccountAddress !== null}
            isFunded={isFunded}
            hasUploadedBlob={hasUploadedBlob}
          />

          {/* Storage Account Manager */}
          <StorageAccountManager
            currentStep={currentStep}
            onStorageAccountCreated={handleStorageAccountCreated}
            onAccountFunded={handleAccountFunded}
            onKeypairReset={handleKeypairReset}
          />

          {/* Blob Uploader */}
          <BlobUploader
            currentStep={currentStep}
            keypair={activeKeypair}
            domain={activeDomain}
            storageAccountAddress={storageAccountAddress}
            onFirstBlobUploaded={handleFirstBlobUploaded}
          />
        </div>
      </main>
    </div>
  );
}
