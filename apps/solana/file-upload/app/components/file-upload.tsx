"use client";

import { useUploadBlobs } from "@shelby-protocol/react";
import { useStorageAccount } from "@shelby-protocol/solana-kit/react";
import { useWalletConnection } from "@solana/react-hooks";
import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { shelbyClient } from "../lib/shelbyClient";

type UploadStep = "idle" | "uploading" | "done" | "error";

export function FileUpload() {
  const { status, wallet } = useWalletConnection();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the new simplified API - pass wallet directly
  const { storageAccountAddress, signAndSubmitTransaction } = useStorageAccount(
    {
      client: shelbyClient,
      wallet,
    },
  );

  const { mutateAsync: uploadBlobs, isPending } = useUploadBlobs({
    client: shelbyClient,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<UploadStep>("idle");
  const [statusMessage, setStatusMessage] = useState<ReactNode | null>(null);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setSelectedFile(file);
      setStep("idle");
      setStatusMessage(null);
    },
    [],
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !storageAccountAddress) return;

    try {
      setStep("uploading");
      setStatusMessage("Uploading file to Shelby...");

      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());

      await uploadBlobs({
        signer: { account: storageAccountAddress, signAndSubmitTransaction },
        blobs: [
          {
            blobName: selectedFile.name,
            blobData: fileBytes,
          },
        ],
        // 30 days from now in microseconds
        expirationMicros: (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000,
      });

      setStep("done");
      const explorerUrl = `https://explorer.shelby.xyz/shelbynet/account/${storageAccountAddress.toString()}/blobs`;
      setStatusMessage(
        <>
          Successfully uploaded: {selectedFile.name}.{" "}
          <a
            className="underline underline-offset-2"
            href={explorerUrl}
            target="_blank"
            rel="noreferrer"
          >
            View in Explorer
          </a>
        </>,
      );
      clearFile();
    } catch (err) {
      setStep("error");
      const message = err instanceof Error ? err.message : "Unknown error";
      const cause =
        err instanceof Error && err.cause instanceof Error
          ? err.cause.message
          : undefined;
      setStatusMessage(
        cause ? `Error: ${message} — ${cause}` : `Error: ${message}`,
      );
    }
  }, [
    selectedFile,
    storageAccountAddress,
    signAndSubmitTransaction,
    uploadBlobs,
    clearFile,
  ]);

  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const isProcessing = step === "uploading" || isPending;

  if (status !== "connected") {
    return (
      <section className="w-full max-w-3xl space-y-4 rounded-2xl border border-border-low bg-card p-6 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.35)]">
        <div className="space-y-1">
          <p className="text-lg font-semibold">Upload File to Shelby</p>
          <p className="text-sm text-muted">
            Connect your wallet to upload files to decentralized storage.
          </p>
        </div>
        <div className="rounded-lg bg-cream/50 p-4 text-center text-sm text-muted">
          Wallet not connected
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-3xl space-y-4 rounded-2xl border border-border-low bg-card p-6 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.35)]">
      <div className="space-y-1">
        <p className="text-lg font-semibold">Upload File to Shelby</p>
        <p className="text-sm text-muted">
          Upload any file to Shelby&apos;s decentralized storage using your
          Solana wallet.
        </p>
      </div>

      {/* File Input */}
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={isProcessing}
          className="hidden"
        />

        <div
          onClick={handleSelectFile}
          className="cursor-pointer rounded-xl border-2 border-dashed border-border-low bg-cream/30 p-8 text-center transition hover:border-foreground/30 hover:bg-cream/50"
        >
          {selectedFile ? (
            <div className="space-y-1">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-muted">Click to select a file</p>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={isProcessing || !selectedFile || !storageAccountAddress}
          className="w-full rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isProcessing ? "Uploading..." : "Upload to Shelby"}
        </button>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm break-all ${
            step === "error"
              ? "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
              : step === "done"
                ? "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                : "border-border-low bg-cream/50"
          }`}
        >
          {statusMessage}
        </div>
      )}

      {/* Storage Account Info */}
      <div className="border-t border-border-low pt-4 text-xs text-muted">
        <p>
          <span className="font-medium">Shelby Storage Account:</span>{" "}
          <span className="font-mono">{storageAccountAddress?.toString()}</span>
        </p>
      </div>
    </section>
  );
}
