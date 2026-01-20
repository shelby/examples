import { Keypair } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { getShelbyClient } from "@/utils/client";

function extractErrorDetails(error: unknown): {
  message: string;
  code?: string;
} {
  if (error instanceof Error) {
    const message = error.message;
    return { message };
  }
  return { message: String(error) };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secretKey, domain, shelbyUsdAmount, aptAmount } = body;

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

    // Create the storage account reference
    const storageAccount = shelbyClient.createStorageAccount(keypair, domain);

    const results: { shelbyUsd?: boolean; apt?: boolean } = {};

    // Fund with ShelbyUSD and APT in parallel for better performance
    const fundingPromises: Promise<void>[] = [];

    if (shelbyUsdAmount && shelbyUsdAmount > 0) {
      fundingPromises.push(
        shelbyClient
          .fundAccountWithShelbyUSD({
            address: storageAccount.accountAddress,
            amount: shelbyUsdAmount,
          })
          .then(() => {
            results.shelbyUsd = true;
          }),
      );
    }

    if (aptAmount && aptAmount > 0) {
      fundingPromises.push(
        shelbyClient
          .fundAccountWithAPT({
            address: storageAccount.accountAddress,
            amount: aptAmount,
          })
          .then(() => {
            results.apt = true;
          }),
      );
    }

    await Promise.all(fundingPromises);

    return NextResponse.json({
      success: true,
      storageAccountAddress: storageAccount.accountAddress.toString(),
      funded: results,
    });
  } catch (error) {
    const errorInfo = extractErrorDetails(error);
    console.error("Error funding account:", {
      message: errorInfo.message,
      code: errorInfo.code,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: errorInfo.message, code: errorInfo.code },
      { status: 500 },
    );
  }
}
