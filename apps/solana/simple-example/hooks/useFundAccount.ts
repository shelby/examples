import { useCallback, useState } from "react";

interface FundAccountResult {
  storageAccountAddress: string;
  funded: {
    shelbyUsd?: boolean;
    apt?: boolean;
  };
}

interface UseFundAccountReturn {
  fundAccount: (
    secretKey: Uint8Array,
    domain: string,
    shelbyUsdAmount?: number,
    aptAmount?: number,
  ) => Promise<FundAccountResult>;
  isFunding: boolean;
  error: string | null;
}

export const useFundAccount = (): UseFundAccountReturn => {
  const [isFunding, setIsFunding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fundAccount = useCallback(
    async (
      secretKey: Uint8Array,
      domain: string,
      shelbyUsdAmount?: number,
      aptAmount?: number,
    ): Promise<FundAccountResult> => {
      setIsFunding(true);
      setError(null);

      try {
        const response = await fetch("/api/fund-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secretKey: Array.from(secretKey),
            domain,
            shelbyUsdAmount,
            aptAmount,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fund account");
        }

        return {
          storageAccountAddress: data.storageAccountAddress,
          funded: data.funded,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      } finally {
        setIsFunding(false);
      }
    },
    [],
  );

  return {
    fundAccount,
    isFunding,
    error,
  };
};
