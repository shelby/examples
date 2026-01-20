import { Keypair } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { getShelbyClient } from "@/utils/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secretKey, domain } = body;

    if (!secretKey || !domain) {
      return NextResponse.json(
        { error: "Missing secretKey or domain" },
        { status: 400 },
      );
    }

    // Reconstruct the keypair from the secret key
    const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));

    // Get the Shelby client
    const shelbyClient = getShelbyClient();

    // Create a storage account controlled by the Solana account
    const storageAccount = shelbyClient.createStorageAccount(keypair, domain);

    return NextResponse.json({
      success: true,
      storageAccountAddress: storageAccount.accountAddress.toString(),
      solanaPublicKey: keypair.publicKey.toString(),
    });
  } catch (error) {
    console.error("Error creating storage account:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
