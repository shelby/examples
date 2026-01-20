"use client";

import { useCallback, useState } from "react";

interface DeleteBlobResult {
  blobName: string;
  transactionHash: string;
}

export const useDeleteBlob = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteBlob = useCallback(
    async (
      secretKey: Uint8Array,
      domain: string,
      blobName: string,
    ): Promise<DeleteBlobResult> => {
      setIsDeleting(true);
      try {
        const response = await fetch("/api/delete-blob", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secretKey: Array.from(secretKey),
            domain,
            blobName,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to delete blob");
        }
        return data;
      } finally {
        setIsDeleting(false);
      }
    },
    [],
  );

  return { deleteBlob, isDeleting };
};
