"use client";

import { useAccountBlobs } from "@shelby-protocol/react";
import { type BlobMetadata } from "@shelby-protocol/sdk/browser";
import {
  appendTransactionMessageInstruction,
  type Blockhash,
  compileTransaction,
  createSolanaRpc,
  createTransactionMessage,
  getTransactionEncoder,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";
import { useSendTransaction, useWalletConnection } from "@solana/react-hooks";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { config, SYSTEM_PROGRAM_ADDRESS } from "../lib/config";
import { shelbyClient } from "../lib/shelbyClient";
import {
  checkHasPurchased,
  deriveAccessReceiptPda,
  deriveBlobMetadataPda,
  encodeAssertAccessData,
  encodePurchaseData,
  fetchBlobMetadata,
} from "../lib/anchor";
import { decryptFile, decryptGreenBox } from "../lib/encryption";
import { buildFullBlobNameBytes, downloadFile } from "../lib/utils";

type PurchaseStep =
  | "idle"
  | "purchasing"
  | "decrypting"
  | "downloading"
  | "done"
  | "error";

export function PurchaseCard() {
  const { status, wallet } = useWalletConnection();
  const { send, isSending } = useSendTransaction();

  const sellerAccount = config.shelby.sellerAccount;
  const {
    data: blobs,
    isLoading: isBlobsLoading,
    error: blobsError,
  } = useAccountBlobs({
    client: shelbyClient,
    account: sellerAccount,
    enabled: !!sellerAccount,
  });

  const [selectedBlob, setSelectedBlob] = useState<BlobMetadata | null>(null);
  const [step, setStep] = useState<PurchaseStep>("idle");
  const [statusMessage, setStatusMessage] = useState<ReactNode | null>(null);
  const [purchasedFiles, setPurchasedFiles] = useState<Map<string, boolean>>(
    new Map()
  );
  const [isCheckingPurchases, setIsCheckingPurchases] = useState(false);

  useEffect(() => {
    if (!wallet || !blobs || blobs.length === 0) return;

    const buyerAddress = wallet.account.address;

    async function checkAllPurchases() {
      setIsCheckingPurchases(true);
      const results = new Map<string, boolean>();

      await Promise.all(
        blobs!.map(async (blob) => {
          try {
            const hasPurchased = await checkHasPurchased(
              blob.owner.bcsToBytes(),
              blob.blobNameSuffix,
              buyerAddress
            );
            results.set(blob.blobNameSuffix, hasPurchased);
          } catch (err) {
            console.error(
              `Error checking purchase status for ${blob.blobNameSuffix}:`,
              err
            );
            results.set(blob.blobNameSuffix, false);
          }
        })
      );

      setPurchasedFiles(results);
      setIsCheckingPurchases(false);
    }

    checkAllPurchases();
  }, [wallet, blobs]);

  const handlePurchase = useCallback(async () => {
    if (!wallet || !selectedBlob) return;

    const buyerAddress = wallet.account.address;
    const fileName = selectedBlob.blobNameSuffix;

    try {
      // Step 1: Build purchase instruction with PDAs and seller info.
      setStep("purchasing");
      setStatusMessage("Building purchase transaction...");

      const storageAccountAddressBytes = selectedBlob.owner.bcsToBytes();
      if (storageAccountAddressBytes.length !== 32) {
        throw new Error("Invalid storage account address: must be 32 bytes");
      }

      const blobMetadataPda = await deriveBlobMetadataPda(
        storageAccountAddressBytes,
        fileName
      );
      const receiptPda = await deriveAccessReceiptPda(
        storageAccountAddressBytes,
        fileName,
        buyerAddress
      );

      const { owner: ownerSolanaPubkey } = await fetchBlobMetadata(
        storageAccountAddressBytes,
        fileName
      );

      const instructionData = await encodePurchaseData(
        storageAccountAddressBytes,
        fileName,
        buyerAddress,
        ownerSolanaPubkey
      );

      const instruction = {
        programAddress: config.programs.accessControl,
        accounts: [
          { address: blobMetadataPda, role: 0 },
          { address: receiptPda, role: 1 },
          { address: buyerAddress, role: 3 },
          { address: ownerSolanaPubkey, role: 1 },
          { address: SYSTEM_PROGRAM_ADDRESS, role: 0 },
        ],
        data: instructionData,
      };

      // Step 2: Sign and submit the purchase transaction.
      setStatusMessage("Awaiting signature...");
      const signature = await send({ instructions: [instruction] });

      setStep("done");
      const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=testnet`;
      setStatusMessage(
        <>
          Purchase successful! You can now decrypt the file.{" "}
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
      setPurchasedFiles((prev) => new Map(prev).set(fileName, true));
    } catch (err) {
      console.error("Purchase failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setStep("error");
      setStatusMessage(`Error: ${errorMessage}`);
    }
  }, [wallet, selectedBlob, send]);

  const handleDecrypt = useCallback(async () => {
    if (!wallet || !selectedBlob) return;

    const buyerAddress = wallet.account.address;
    const fileName = selectedBlob.blobNameSuffix;

    try {
      setStep("decrypting");
      setStatusMessage("Building proof of permission...");

      // Step 1: Build the assert_access instruction as proof of permission.
      const storageAccountAddressBytes = selectedBlob.owner.bcsToBytes();
      const fullBlobNameBytes = buildFullBlobNameBytes(
        storageAccountAddressBytes,
        fileName
      );

      const blobMetadataPda = await deriveBlobMetadataPda(
        storageAccountAddressBytes,
        fileName
      );
      const receiptPda = await deriveAccessReceiptPda(
        storageAccountAddressBytes,
        fileName,
        buyerAddress
      );

      const assertAccessData = await encodeAssertAccessData(
        fullBlobNameBytes,
        buyerAddress,
        blobMetadataPda,
        receiptPda
      );

      const instruction = {
        programAddress: config.programs.aceHook,
        accounts: [
          { address: blobMetadataPda, role: 0 },
          { address: receiptPda, role: 0 },
          { address: buyerAddress, role: 2 },
        ],
        data: assertAccessData,
      };

      // Step 2: Build and sign the transaction (not submitted, only used as proof).
      const rpc = createSolanaRpc(config.solanaRpcUrl);
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
      const { blockhash, lastValidBlockHeight } = latestBlockhash;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let txMessage: any = createTransactionMessage({ version: 0 });
      txMessage = setTransactionMessageFeePayer(buyerAddress, txMessage);
      txMessage = setTransactionMessageLifetimeUsingBlockhash(
        {
          blockhash: blockhash as Blockhash,
          lastValidBlockHeight: BigInt(lastValidBlockHeight),
        },
        txMessage
      );
      txMessage = appendTransactionMessageInstruction(instruction, txMessage);

      const compiledTx = compileTransaction(txMessage);

      setStatusMessage("Signing proof of permission...");

      if (!wallet.signTransaction) {
        throw new Error(
          "Wallet does not support signing transactions. " +
            "Please use a wallet that supports the signTransaction feature."
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signedTx = await wallet.signTransaction(compiledTx as any);

      const txEncoder = getTransactionEncoder();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const serializedTx = new Uint8Array(txEncoder.encode(signedTx as any));

      // Step 3: Send proof to ACE workers and receive the decryption key.
      const { greenBoxBytes } = await fetchBlobMetadata(
        storageAccountAddressBytes,
        fileName
      );

      setStatusMessage("Fetching decryption key from ACE committee...");

      const redKey = await decryptGreenBox(
        greenBoxBytes,
        fullBlobNameBytes,
        serializedTx
      );

      // Step 4: Fetch the encrypted file from Shelby storage.
      setStep("downloading");
      setStatusMessage("Fetching encrypted file from Shelby...");

      const blob = await shelbyClient.rpc.getBlob({
        account: selectedBlob.owner.toString(),
        blobName: fileName,
      });

      const reader = blob.readable.getReader();
      const chunks: Uint8Array[] = [];
      let totalLength = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalLength += value.length;
      }
      const redBox = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        redBox.set(chunk, offset);
        offset += chunk.length;
      }

      // Step 5: Decrypt and download the file.
      setStatusMessage("Decrypting file...");
      const plaintext = await decryptFile(redBox, redKey);

      downloadFile(plaintext, fileName);

      setStep("done");
      setStatusMessage("File decrypted and downloaded!");
    } catch (err) {
      console.error("Decryption failed:", err);
      setStep("error");
      setStatusMessage(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }, [wallet, selectedBlob]);

  const isProcessing = step !== "idle" && step !== "done" && step !== "error";
  const hasPurchased = selectedBlob
    ? purchasedFiles.get(selectedBlob.blobNameSuffix) === true
    : false;

  const handleAction = useCallback(async () => {
    if (!selectedBlob) return;

    if (hasPurchased) {
      await handleDecrypt();
    } else {
      await handlePurchase();
    }
  }, [selectedBlob, hasPurchased, handleDecrypt, handlePurchase]);

  if (!sellerAccount) {
    return (
      <section className="w-full max-w-3xl space-y-4 rounded-2xl border border-border-low bg-card p-6 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.35)]">
        <div className="space-y-1">
          <p className="text-lg font-semibold">Browse Files</p>
          <p className="text-sm text-muted">
            No seller account configured. Set{" "}
            <code className="font-mono text-xs bg-cream/50 px-1 py-0.5 rounded">
              NEXT_PUBLIC_SELLER_ACCOUNT
            </code>{" "}
            in your <code className="font-mono text-xs">.env</code> file.
          </p>
        </div>
      </section>
    );
  }

  const isConnected = status === "connected";

  return (
    <section className="w-full max-w-3xl space-y-4 rounded-2xl border border-border-low bg-card p-6 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.35)]">
      <div className="space-y-1">
        <p className="text-lg font-semibold">Browse Files</p>
        <p className="text-sm text-muted">
          {isConnected
            ? "Select a file to purchase access and decrypt."
            : "Connect your wallet to purchase access to token-gated files."}
        </p>
      </div>

      {/* File Grid */}
      <div>
        {isBlobsLoading && (
          <div className="rounded-lg bg-cream/50 p-8 text-center text-sm text-muted">
            Loading files...
          </div>
        )}

        {isCheckingPurchases && !isBlobsLoading && (
          <div className="text-xs text-muted text-center animate-pulse mb-4">
            Checking purchase status...
          </div>
        )}

        {blobsError && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            Failed to load files: {blobsError.message}
          </div>
        )}

        {blobs && blobs.length === 0 && (
          <div className="rounded-lg bg-cream/50 p-8 text-center text-sm text-muted">
            No files found for this account.
          </div>
        )}

        {blobs && blobs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {blobs.map((blob) => {
              const isSelected =
                selectedBlob?.blobNameSuffix === blob.blobNameSuffix;
              const isPurchased =
                isConnected && purchasedFiles.get(blob.blobNameSuffix) === true;
              return (
                <button
                  key={blob.blobNameSuffix}
                  onClick={() => setSelectedBlob(blob)}
                  disabled={isProcessing || isSending}
                  className={`group relative flex flex-col rounded-xl border bg-card p-4 text-left transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                    isSelected
                      ? "border-foreground/50 shadow-lg shadow-foreground/5"
                      : "border-border-low hover:-translate-y-1 hover:shadow-lg hover:shadow-foreground/5 hover:border-foreground/20"
                  }`}
                >
                  {/* File Name + Lock Icon */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p
                      className="text-sm font-medium truncate"
                      title={blob.blobNameSuffix}
                    >
                      {blob.blobNameSuffix}
                    </p>
                    {isPurchased ? (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                    ) : (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-muted">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </span>
                    )}
                  </div>

                  {/* File Size */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">
                      {(blob.size / 1024).toFixed(1)} KB
                    </span>
                    {isPurchased && (
                      <span className="text-[10px] font-medium text-green-500">
                        Purchased
                      </span>
                    )}
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-xl ring-2 ring-foreground/30 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Button - only show when a file is selected */}
      {selectedBlob && (
        <button
          onClick={handleAction}
          disabled={
            !isConnected || isProcessing || isSending || isCheckingPurchases
          }
          className={`w-full rounded-lg px-5 py-3 text-sm font-medium transition ${
            !isConnected
              ? "bg-foreground/50 text-background"
              : hasPurchased
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-foreground text-background hover:opacity-90"
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {!isConnected
            ? "Connect wallet to purchase"
            : isCheckingPurchases
              ? "Checking access..."
              : step === "purchasing"
                ? "Purchasing..."
                : step === "decrypting" || step === "downloading"
                  ? "Decrypting..."
                  : hasPurchased
                    ? "Download File"
                    : "Purchase & Download"}
        </button>
      )}

      {/* Status Message - only show when a file is selected */}
      {selectedBlob && statusMessage && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
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
    </section>
  );
}
