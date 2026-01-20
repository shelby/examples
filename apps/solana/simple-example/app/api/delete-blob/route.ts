import { ShelbyBlobClient } from "@shelby-protocol/sdk/node";
import { Keypair } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { getShelbyClient } from "@/utils/client";

export async function POST(request: Request) {
  try {
    const { secretKey, domain, blobName } = await request.json();

    if (!secretKey || !domain || !blobName) {
      return NextResponse.json(
        { error: "Missing required fields: secretKey, domain, blobName" },
        { status: 400 },
      );
    }

    // Reconstruct the keypair from the secret key
    const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));

    // Get the Shelby client
    const shelbyClient = getShelbyClient();

    // Create the storage account reference
    const storageAccount = shelbyClient.createStorageAccount(keypair, domain);

    // Create delete payload
    const payload = ShelbyBlobClient.createDeleteBlobPayload({
      blobNameSuffix: blobName,
    });

    // Build, sign, and submit transaction
    const transaction = await shelbyClient.aptos.transaction.build.simple({
      sender: storageAccount.accountAddress,
      data: payload,
    });

    const authenticator =
      storageAccount.signTransactionWithAuthenticator(transaction);
    const response = await shelbyClient.aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator: authenticator,
    });

    await shelbyClient.aptos.waitForTransaction({
      transactionHash: response.hash,
    });

    return NextResponse.json({
      success: true,
      blobName,
      transactionHash: response.hash,
    });
  } catch (error) {
    console.error("Error deleting blob:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
