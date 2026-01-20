import { useCallback, useState } from "react";

interface CreateStorageAccountResult {
  storageAccountAddress: string;
  solanaPublicKey: string;
}

interface UseCreateStorageAccountReturn {
  createStorageAccount: (
    secretKey: Uint8Array,
    domain: string,
  ) => Promise<CreateStorageAccountResult>;
  isCreating: boolean;
  error: string | null;
}

export const useCreateStorageAccount = (): UseCreateStorageAccountReturn => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStorageAccount = useCallback(
    async (
      secretKey: Uint8Array,
      domain: string,
    ): Promise<CreateStorageAccountResult> => {
      setIsCreating(true);
      setError(null);

      try {
        const response = await fetch("/api/create-storage-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secretKey: Array.from(secretKey),
            domain,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create storage account");
        }

        return {
          storageAccountAddress: data.storageAccountAddress,
          solanaPublicKey: data.solanaPublicKey,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [],
  );

  return {
    createStorageAccount,
    isCreating,
    error,
  };
};
