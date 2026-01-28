"use client";

import {
  Network,
  useStorageAccount,
} from "@shelby-protocol/ethereum-kit/react";
import { useUploadBlobs } from "@shelby-protocol/react";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAccount, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const SHELBY_API_KEY = process.env.NEXT_PUBLIC_SHELBY_API_KEY || "";

export function FileUploader() {
  const { isConnected } = useAccount();
  const { data: wallet } = useWalletClient();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFile = useCallback(() => {
    setFile(null);
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const shelbyClient = useMemo(
    () =>
      new ShelbyClient({
        network: Network.SHELBYNET,
        apiKey: SHELBY_API_KEY,
      }),
    [],
  );

  const { storageAccountAddress, signAndSubmitTransaction } = useStorageAccount(
    {
      client: shelbyClient,
      wallet,
    },
  );

  const { mutateAsync: uploadBlobs, isPending } = useUploadBlobs({
    client: shelbyClient,
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
      }
    },
    [],
  );

  const handleUpload = async () => {
    if (!file || !storageAccountAddress) return;

    try {
      const buffer = await file.arrayBuffer();
      const expirationMicros = Date.now() * 1000 + 86400000000 * 7; // 7 days

      // Create a signer compatible with useUploadBlobs
      const signer = {
        account: storageAccountAddress,
        signAndSubmitTransaction,
      };

      await uploadBlobs({
        signer,
        blobs: [
          {
            blobName: file.name,
            blobData: new Uint8Array(buffer),
          },
        ],
        expirationMicros,
      });

      toast.success("File uploaded successfully!", {
        description: (
          <span>
            {file.name} has been stored on Shelby.{" "}
            <a
              href={`https://explorer.shelby.xyz/shelbynet/account/${storageAccountAddress.toString()}/blobs`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-emerald-400 hover:text-emerald-300"
            >
              View in Explorer
            </a>
          </span>
        ),
      });
      clearFile();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  if (!isConnected) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-slate-400">
            Connect an Ethereum wallet to upload files to Shelby
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage Account Info */}
      {storageAccountAddress && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-400">Storage Account</p>
                <p className="text-white font-mono text-sm truncate">
                  {storageAccountAddress.toString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6">
          <section
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            aria-label="File drop zone"
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/5"
                  : "border-slate-700 hover:border-slate-600"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
              disabled={isPending}
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-slate-800 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-white font-medium mb-1">
                {isDragging ? "Drop your file here" : "Drag and drop a file"}
              </p>
              <p className="text-slate-400 text-sm">
                or click to browse from your computer
              </p>
            </label>
          </section>

          {/* Selected File */}
          {file && (
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-slate-400 text-sm">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  disabled={isPending}
                  className="text-slate-400 hover:text-white"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isPending && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Uploading...</span>
                <span className="text-emerald-400">Please sign in wallet</span>
              </div>
              <Progress value={33} className="h-2" />
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!file || isPending || !storageAccountAddress}
            className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-950 font-semibold"
            size="lg"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Uploading...
              </span>
            ) : (
              "Upload to Shelby"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
