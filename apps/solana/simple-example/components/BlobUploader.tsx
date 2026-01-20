"use client";

import { toast } from "@shelby-protocol/ui/components";
import { Button } from "@shelby-protocol/ui/components/button";
import type { Keypair } from "@solana/web3.js";
import { memo, useCallback, useEffect, useState } from "react";
import { useDeleteBlob } from "@/hooks/useDeleteBlob";
import { useUploadBlob } from "@/hooks/useUploadBlob";

interface BlobUploaderProps {
  currentStep: number;
  keypair: Keypair | null;
  domain: string;
  storageAccountAddress: string | null;
  onFirstBlobUploaded?: () => void;
}

interface UploadedBlob {
  name: string;
  url: string;
  uploadedAt: Date;
}

export const BlobUploader = memo(function BlobUploader({
  currentStep,
  keypair,
  domain,
  storageAccountAddress,
  onFirstBlobUploaded,
}: BlobUploaderProps) {
  const { uploadBlob, isUploading } = useUploadBlob();
  const { deleteBlob, isDeleting } = useDeleteBlob();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedBlobs, setUploadedBlobs] = useState<UploadedBlob[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!storageAccountAddress) {
      setUploadedBlobs([]);
    }
  }, [storageAccountAddress]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isDuplicate = uploadedBlobs.some((blob) => blob.name === file.name);
      if (isDuplicate) {
        setStatusMessage(
          `A blob named "${file.name}" already exists. Delete it first to upload a new version.`,
        );
        event.target.value = "";
        return;
      }
      setSelectedFile(file);
      setStatusMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !keypair || !domain) return;

    // Defensive check: prevent upload if blob with same name already exists
    if (uploadedBlobs.some((blob) => blob.name === selectedFile.name)) {
      setStatusMessage(
        `A blob named "${selectedFile.name}" already exists. Delete it first to upload a new version.`,
      );
      return;
    }

    try {
      setStatusMessage("Uploading blob...");

      const arrayBuffer = await selectedFile.arrayBuffer();
      const blobData = new Uint8Array(arrayBuffer);

      const result = await uploadBlob(
        keypair.secretKey,
        domain,
        selectedFile.name,
        blobData,
        30, // 30 days expiration
      );

      if (uploadedBlobs.length === 0) {
        onFirstBlobUploaded?.();
      }

      setUploadedBlobs((prev) => [
        {
          name: result.blobName,
          url: result.blobUrl,
          uploadedAt: new Date(),
        },
        ...prev,
      ]);

      setSelectedFile(null);
      setStatusMessage("Blob uploaded successfully!");

      // Reset file input
      const fileInput = document.getElementById(
        "blob-file-upload",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE")) {
        toast.error(
          'Your account needs funding before uploading. Please click "Fund Account" to add APT for transaction fees.',
        );
        setStatusMessage(null);
      } else if (errorMessage.includes("E_INSUFFICIENT_FUNDS")) {
        toast.error(
          'Your account needs more ShelbyUSD to pay for storage. Please click "Fund Account" to add ShelbyUSD tokens.',
        );
        setStatusMessage(null);
      } else {
        setStatusMessage(`Error: ${errorMessage}`);
      }
    }
  };

  const handleDelete = useCallback(
    async (blobName: string) => {
      if (!keypair || !domain) return;
      try {
        await deleteBlob(keypair.secretKey, domain, blobName);
        setUploadedBlobs((prev) =>
          prev.filter((blob) => blob.name !== blobName),
        );
        toast.success(`Blob "${blobName}" deleted successfully`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete blob",
        );
      }
    },
    [keypair, domain, deleteBlob],
  );

  const handleFileInputClick = useCallback(() => {
    document.getElementById("blob-file-upload")?.click();
  }, []);

  const isDisabled = !keypair || !storageAccountAddress;

  // Glow logic for step 3: file input when no file selected, upload button when file selected
  const showFileInputGlow = currentStep === 3 && !selectedFile;
  const showUploadGlow = currentStep === 3 && selectedFile !== null;

  return (
    <div className="glass-neon rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Upload Blob
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload files to your Shelby storage account.
        </p>
      </div>

      {isDisabled ? (
        <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-sm text-muted-foreground">
            Create and fund a storage account first to upload blobs.
          </p>
        </div>
      ) : (
        <>
          {/* File Input */}
          <div className="space-y-2">
            <input
              id="blob-file-upload"
              type="file"
              onChange={handleFileChange}
              className="sr-only"
            />
            <Button
              variant="outline"
              onClick={handleFileInputClick}
              className={showFileInputGlow ? "glow-pulse" : ""}
            >
              Choose File
            </Button>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                <span className="text-sm font-medium text-foreground">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button
                variant="outline"
                onClick={handleUpload}
                disabled={isUploading}
                className={showUploadGlow ? "glow-pulse" : ""}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
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
        </>
      )}

      {/* Uploaded Blobs List */}
      {uploadedBlobs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Uploaded Blobs
          </h3>
          <div className="space-y-2">
            {uploadedBlobs.map((blob, index) => (
              <div
                key={`${blob.name}-${index}`}
                className="p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {blob.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <a
                      href={blob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md text-[var(--poline-accent-9)] hover:text-[var(--poline-surface-1)] hover:bg-[var(--poline-accent-9)] transition-colors"
                      title="View"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-labelledby="view-icon-title"
                      >
                        <title id="view-icon-title">View blob</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(blob.name)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-md text-[var(--poline-accent-1)] hover:text-[var(--poline-surface-1)] hover:bg-[var(--poline-accent-1)] disabled:opacity-50 transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-labelledby="delete-icon-title"
                      >
                        <title id="delete-icon-title">Delete blob</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
                  {blob.url}
                </p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  {blob.uploadedAt.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
