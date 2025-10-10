import {
  Account,
  Ed25519PrivateKey,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import {
  type InputTransactionData,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import {
  type BlobCommitments,
  expectedTotalChunksets,
  ShelbyBlobClient,
} from "@shelby-protocol/sdk/browser";
import { useCallback, useState } from "react";
import { getAptosClient, getShelbyClient } from "@/utils/client";

interface UseSubmitFileToChainReturn {
  submitFileToChain: (commitment: BlobCommitments, file: File) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

export const useSubmitFileToChain = (): UseSubmitFileToChainReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { account, wallet, signAndSubmitTransaction, signTransaction } =
    useWallet();

  const submitFileToChain = useCallback(
    async (commitment: BlobCommitments, file: File) => {
      if (!account || !wallet) {
        throw new Error("Account and wallet are required");
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const payload = ShelbyBlobClient.createRegisterBlobPayload({
          account: account.address,
          blobName: file.name,
          blobMerkleRoot: commitment.blob_merkle_root,
          numChunksets: expectedTotalChunksets(commitment.raw_data_size),
          expirationMicros: (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000, // 30 days from now in microseconds
          blobSize: commitment.raw_data_size,
        });

        if (wallet.isAptosNativeWallet) {
          const transaction: InputTransactionData = {
            data: payload,
          };
          const transactionSubmitted =
            await signAndSubmitTransaction(transaction);

          await getAptosClient().waitForTransaction({
            transactionHash: transactionSubmitted.hash,
          });
        } else {
          // Create the sponsor account
          const privateKey = new Ed25519PrivateKey(
            PrivateKey.formatPrivateKey(
              process.env.NEXT_PUBLIC_SPONSOR_PRIVATE_KEY as string,
              PrivateKeyVariants.Ed25519,
            ),
          );
          const sponsorAccount = Account.fromPrivateKey({ privateKey });

          const rawTransaction =
            await getShelbyClient().aptos.transaction.build.simple({
              sender: account.address,
              data: payload,
              withFeePayer: true,
            });

          const walletSignedTransaction = await signTransaction({
            transactionOrPayload: rawTransaction,
          });

          const sponsorAuthenticator =
            getShelbyClient().aptos.transaction.signAsFeePayer({
              signer: sponsorAccount,
              transaction: rawTransaction,
            });

          const transactionSubmitted =
            await getShelbyClient().aptos.transaction.submit.simple({
              transaction: rawTransaction,
              senderAuthenticator: walletSignedTransaction.authenticator,
              feePayerAuthenticator: sponsorAuthenticator,
            });

          await getShelbyClient().aptos.waitForTransaction({
            transactionHash: transactionSubmitted.hash,
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [account, wallet, signAndSubmitTransaction, signTransaction],
  );

  return {
    submitFileToChain,
    isSubmitting,
    error,
  };
};
