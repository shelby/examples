"use client";

import { useUploadBlobs } from "@shelby-protocol/react";
import { useStorageAccount } from "@shelby-protocol/solana-kit/react";
import { useSendTransaction, useWalletConnection } from "@solana/react-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  config,
  GREEN_BOX_SCHEME,
  LAMPORTS_PER_SOL,
  SYSTEM_PROGRAM_ADDRESS,
} from "../lib/config";
import { deriveBlobMetadataPda, encodeRegisterBlobData } from "../lib/anchor";
import { encryptFile, encryptRedKey, generateRedKey } from "../lib/encryption";
import { buildFullBlobNameBytes } from "../lib/utils";
import { shelbyClient } from "../lib/shelbyClient";

type UploadStep =
  | "idle"
  | "encrypting"
  | "uploading"
  | "registering"
  | "done"
  | "error";

export function FileUpload() {
  const { status, wallet } = useWalletConnection();
  const { send, isSending } = useSendTransaction();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { storageAccountAddress, signAndSubmitTransaction } = useStorageAccount(
    {
      client: shelbyClient,
      wallet,
    }
  );

  const { mutateAsync: uploadBlobs } = useUploadBlobs({
    client: shelbyClient,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [price, setPrice] = useState<string>(config.pricing.defaultPriceSol);
  const [step, setStep] = useState<UploadStep>("idle");
  const [statusMessage, setStatusMessage] = useState<ReactNode | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setSelectedFile(file);
      setStep("idle");
      setStatusMessage(null);
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !storageAccountAddress || !wallet) return;

    const walletAddress = wallet.account.address;

    try {
      // Step 1: Generate a random AES key and encrypt the file.
      setStep("encrypting");
      setStatusMessage("Generating encryption key and encrypting file...");

      const redKey = generateRedKey();
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
      const redBox = await encryptFile(fileBytes, redKey);

      // Step 2: Encrypt the AES key with threshold IBE so only buyers can decrypt.
      const storageAccountAddressBytes = storageAccountAddress.toUint8Array();
      const fullBlobNameBytes = buildFullBlobNameBytes(
        storageAccountAddressBytes,
        selectedFile.name
      );

      setStatusMessage("Encrypting access key with threshold cryptography...");
      const greenBoxBytes = await encryptRedKey(redKey, fullBlobNameBytes);

      // Step 3: Upload the encrypted file to Shelby storage.
      setStep("uploading");
      setStatusMessage("Uploading encrypted file to Shelby...");

      await uploadBlobs({
        signer: { account: storageAccountAddress, signAndSubmitTransaction },
        blobs: [
          {
            blobName: selectedFile.name,
            blobData: redBox,
          },
        ],
        expirationMicros: (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000,
      });

      // Step 4: Register the encrypted key and price on-chain.
      setStep("registering");
      setStatusMessage("Registering file on Solana...");

      const priceLamports = BigInt(
        Math.floor(Number.parseFloat(price) * Number(LAMPORTS_PER_SOL))
      );

      const blobMetadataPda = await deriveBlobMetadataPda(
        storageAccountAddressBytes,
        selectedFile.name
      );
      const instructionData = await encodeRegisterBlobData(
        storageAccountAddressBytes,
        selectedFile.name,
        GREEN_BOX_SCHEME,
        greenBoxBytes,
        priceLamports,
        walletAddress
      );

      const instruction = {
        programAddress: config.programs.accessControl,
        accounts: [
          { address: blobMetadataPda, role: 1 },
          { address: walletAddress, role: 3 },
          { address: SYSTEM_PROGRAM_ADDRESS, role: 0 },
        ],
        data: instructionData,
      };

      const result = await send({ instructions: [instruction] });

      setStep("done");
      const explorerUrl = `https://explorer.solana.com/tx/${result}?cluster=testnet`;
      setStatusMessage(
        <>
          Successfully uploaded and registered: {selectedFile.name}.
          <a
            className="underline underline-offset-2"
            href={explorerUrl}
            target="_blank"
            rel="noreferrer"
          >
            View transaction
          </a>
        </>
      );
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setTimeout(() => {
        queryClient.invalidateQueries();
      }, 1500);
    } catch (err) {
      setStep("error");
      const message = err instanceof Error ? err.message : "Unknown error";
      const cause =
        err instanceof Error && err.cause instanceof Error
          ? err.cause.message
          : undefined;
      setStatusMessage(
        cause ? `Error: ${message} — ${cause}` : `Error: ${message}`
      );
    }
  }, [
    selectedFile,
    storageAccountAddress,
    wallet,
    price,
    send,
    signAndSubmitTransaction,
    uploadBlobs,
    queryClient,
  ]);

  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const isProcessing = step !== "idle" && step !== "done" && step !== "error";

  if (status !== "connected") {
    return (
      <section className="w-full max-w-3xl space-y-4 rounded-2xl border border-border-low bg-card p-6 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.35)]">
        <div className="space-y-1">
          <p className="text-lg font-semibold">Upload Token-Gated File</p>
          <p className="text-sm text-muted">
            Connect your wallet to upload encrypted files that can be purchased
            by others.
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
        <p className="text-lg font-semibold">Upload Token-Gated File</p>
        <p className="text-sm text-muted">
          Upload an encrypted file to Shelby and register it on Solana. Others
          can purchase access to decrypt it.
        </p>
      </div>

      {/* File Input */}
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={isProcessing || isSending}
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
              <p className="text-sm text-muted">
                Click to select a file to sell
              </p>
            </div>
          )}
        </div>

        {/* Price Input */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted">Price (SOL):</label>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={isProcessing || isSending}
            className="flex-1 rounded-lg border border-border-low bg-card px-4 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={isProcessing || isSending || !selectedFile}
          className="w-full rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isProcessing || isSending ? "Processing..." : "Upload & Register"}
        </button>
      </div>

      {/* Progress Steps */}
      {step !== "idle" && (
        <div className="space-y-2 rounded-lg border border-border-low bg-cream/30 p-4">
          <div className="flex items-center gap-2">
            <StepIndicator
              active={step === "encrypting"}
              done={
                step === "uploading" ||
                step === "registering" ||
                step === "done"
              }
            />
            <span className="text-sm">Encrypt file</span>
          </div>
          <div className="flex items-center gap-2">
            <StepIndicator
              active={step === "uploading"}
              done={step === "registering" || step === "done"}
            />
            <span className="text-sm">Upload to Shelby</span>
          </div>
          <div className="flex items-center gap-2">
            <StepIndicator
              active={step === "registering"}
              done={step === "done"}
            />
            <span className="text-sm">Register on Solana</span>
          </div>
        </div>
      )}

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

function StepIndicator({ active, done }: { active: boolean; done: boolean }) {
  if (done) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-xs">
        ✓
      </span>
    );
  }
  if (active) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
        <span className="h-2 w-2 animate-pulse rounded-full bg-background" />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-border-low" />
  );
}
