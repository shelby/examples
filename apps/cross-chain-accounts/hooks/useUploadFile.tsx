import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import { getShelbyClient } from "@/utils/client";

interface UseUploadFileReturn {
  uploadFileToRcp: (file: File) => Promise<void>;
  isUploading: boolean;
  error: string | null;
}

export const useUploadFile = (): UseUploadFileReturn => {
  const { account, wallet } = useWallet();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFileToRcp = async (file: File) => {
    if (!account || !wallet) {
      throw new Error("Wallet not connected");
    }

    setIsUploading(true);
    setError(null);

    try {
      await getShelbyClient().rpc.putBlob({
        account: account.address,
        blobName: file.name,
        blobData: new Uint8Array(await file.arrayBuffer()),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFileToRcp,
    isUploading,
    error,
  };
};
