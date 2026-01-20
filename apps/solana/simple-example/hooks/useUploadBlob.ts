import { useCallback, useState } from "react";

interface UploadBlobResult {
  blobName: string;
  blobUrl: string;
  storageAccountAddress: string;
  expirationMicros: number;
}

interface UseUploadBlobReturn {
  uploadBlob: (
    secretKey: Uint8Array,
    domain: string,
    blobName: string,
    blobData: Uint8Array,
    expirationDays?: number,
  ) => Promise<UploadBlobResult>;
  isUploading: boolean;
  error: string | null;
}

export const useUploadBlob = (): UseUploadBlobReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadBlob = useCallback(
    async (
      secretKey: Uint8Array,
      domain: string,
      blobName: string,
      blobData: Uint8Array,
      expirationDays = 1,
    ): Promise<UploadBlobResult> => {
      setIsUploading(true);
      setError(null);

      try {
        const response = await fetch("/api/upload-blob", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secretKey: Array.from(secretKey),
            domain,
            blobName,
            blobData: Array.from(blobData),
            expirationDays,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to upload blob");
        }

        return {
          blobName: data.blobName,
          blobUrl: data.blobUrl,
          storageAccountAddress: data.storageAccountAddress,
          expirationMicros: data.expirationMicros,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  return {
    uploadBlob,
    isUploading,
    error,
  };
};
