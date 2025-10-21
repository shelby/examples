import type { AccountAddress } from "@aptos-labs/ts-sdk";
import { type AccountInfo, useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  ClayErasureCodingProvider,
  expectedTotalChunksets,
  generateCommitments,
  ShelbyBlobClient,
} from "@shelby-protocol/sdk/browser";
import { useCallback, useState } from "react";
import { getShelbyClient } from "@/utils/client";
import { useSubmitCommitmentTransaction } from "./useSubmitCommitmentTransaction";

interface UseUploadImageToShelbyReturn {
  uploadImageToShelby: (
    imageBuffer: Buffer,
    imageName: string,
  ) => Promise<{
    url: string;
    account: AccountAddress;
    blobName: string;
  }>;
  uploadMetadataToShelby: (
    metadata: Record<string, unknown>,
    metadataName: string,
  ) => Promise<{
    url: string;
    account: AccountAddress;
    blobName: string;
  }>;
  isUploading: boolean;
  error: string | null;
}

export const useUploadImageToShelby = (): UseUploadImageToShelbyReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { account, wallet } = useWallet();
  const { submitTransaction } = useSubmitCommitmentTransaction();

  const uploadImageToShelby = useCallback(
    async (imageBuffer: Buffer, blobName: string) => {
      if (!account || !wallet) {
        throw new Error("Wallet not connected");
      }

      setIsUploading(true);
      setError(null);

      try {
        const blobNameImage = `images/${blobName}.png`;

        // 1. Generate commitments for the image
        const payload = await generateCommitment(
          imageBuffer,
          blobNameImage,
          account,
        );

        // 4. Submit transaction to register the blob on chain
        await submitTransaction(payload);

        // 5. Upload the actual file data to Shelby RPC
        const response = await uploadToShlebyRPC(
          new Uint8Array(imageBuffer),
          blobNameImage,
          account,
        );

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [account, wallet, submitTransaction],
  );

  const uploadMetadataToShelby = useCallback(
    async (metadata: Record<string, unknown>, metadataName: string) => {
      if (!account || !wallet) {
        throw new Error("Wallet not connected");
      }

      setIsUploading(true);
      setError(null);

      try {
        const blobNameJson = `metadata/${metadataName}.json`;

        // 1. Generate commitments for the image
        const payload = await generateCommitment(
          Buffer.from(JSON.stringify(metadata, null, 2)),
          blobNameJson,
          account,
        );

        // 4. Submit transaction to register the blob on chain
        await submitTransaction(payload);

        // 5. Upload the actual file data to Shelby RPC
        const response = await uploadToShlebyRPC(
          new Uint8Array(Buffer.from(JSON.stringify(metadata, null, 2))),
          blobNameJson,
          account,
        );

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [account, wallet, submitTransaction],
  );

  return {
    uploadImageToShelby,
    uploadMetadataToShelby,
    isUploading,
    error,
  };
};

const generateCommitment = async (
  data: Buffer,
  blobName: string,
  account: AccountInfo,
) => {
  const provider = await ClayErasureCodingProvider.create();
  // 1. Generate commitments for the image
  const commitments = await generateCommitments(provider, data);

  // 3. Create the transaction payload
  const payload = ShelbyBlobClient.createRegisterBlobPayload({
    account: account.address,
    blobName: blobName,
    blobMerkleRoot: commitments.blob_merkle_root,
    numChunksets: expectedTotalChunksets(commitments.raw_data_size),
    expirationMicros: (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000, // 30 days from now
    blobSize: commitments.raw_data_size,
  });

  return payload;
};

const uploadToShlebyRPC = async (
  data: Uint8Array,
  blobName: string,
  account: AccountInfo,
) => {
  await getShelbyClient().rpc.putBlob({
    account: account.address,
    blobName,
    blobData: new Uint8Array(data),
  });

  // 6. Return the public URL and metadata
  const url = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${account.address.toString()}/${encodeURIComponent(
    blobName,
  )}`;

  return {
    url,
    account: account.address,
    blobName,
  };
};
