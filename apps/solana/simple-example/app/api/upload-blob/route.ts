import { Keypair } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { getShelbyClient } from "@/utils/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secretKey, domain, blobName, blobData, expirationDays = 1 } = body;

    if (!secretKey || !domain || !blobName || !blobData) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: secretKey, domain, blobName, blobData",
        },
        { status: 400 },
      );
    }

    // Reconstruct the keypair from the secret key
    const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));

    // Get the Shelby client
    const shelbyClient = getShelbyClient();

    // Create the storage account reference
    const storageAccount = shelbyClient.createStorageAccount(keypair, domain);

    // Calculate expiration in microseconds
    const expirationMicros =
      Date.now() * 1000 + expirationDays * 24 * 60 * 60 * 1000 * 1000;

    // Upload the blob
    await shelbyClient.upload({
      blobData: new Uint8Array(blobData),
      signer: storageAccount,
      blobName,
      expirationMicros,
    });

    // Construct the blob URL
    const blobUrl = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${storageAccount.accountAddress.toString()}/${blobName}`;

    return NextResponse.json({
      success: true,
      blobName,
      blobUrl,
      storageAccountAddress: storageAccount.accountAddress.toString(),
      expirationMicros,
    });
  } catch (error) {
    console.error("Error uploading blob:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
