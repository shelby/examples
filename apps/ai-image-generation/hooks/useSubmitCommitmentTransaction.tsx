import {
  Account,
  Ed25519PrivateKey,
  type InputGenerateTransactionPayloadData,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import {
  type InputTransactionData,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { useCallback } from "react";
import { getAptosClient, getShelbyClient } from "@/utils/client";

export const useSubmitCommitmentTransaction = () => {
  const { account, wallet, signAndSubmitTransaction, signTransaction } =
    useWallet();

  const submitTransaction = useCallback(
    async (payload: InputGenerateTransactionPayloadData) => {
      if (!account || !wallet) {
        throw new Error("Wallet not connected");
      }

      // Handle Aptos native wallets
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
        // Handle cross-chain wallets with sponsored transactions
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
    },
    [account, wallet, signAndSubmitTransaction, signTransaction],
  );

  return { submitTransaction };
};
