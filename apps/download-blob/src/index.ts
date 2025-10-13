// download.ts — run with: npx tsx download.ts

import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";
import { AccountAddress, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";

if (!process.env.SHELBY_API_KEY) {
  throw new Error("Missing SHELBY_API_KEY");
}
if (!process.env.SHELBY_ACCOUNT_ADDRESS) {
  throw new Error("Missing SHELBY_ACCOUNT_ADDRESS");
}

// The blob name as stored in Shelby (must match what you uploaded or already have).
const BLOB_NAME = "whitepaper.pdf";

// Where to save the downloaded file locally.
const OUT_PATH = join(process.cwd(), "downloads", BLOB_NAME);

// 1) Initialize a Shelby client (auth via API key; target shelbynet).
const client = new ShelbyNodeClient({
  network: Network.SHELBYNET,
  apiKey: process.env.SHELBY_API_KEY, // ensure .env is loaded
});

// 2) Parse the account address you'll download from.
//    ⚠️ This should be the *same account* that previously uploaded the blob.
const account = AccountAddress.fromString(process.env.SHELBY_ACCOUNT_ADDRESS);

// 3) Ask Shelby for a readable Web stream of the blob bytes.
const { readable } = await client.download({ account, blobName: BLOB_NAME });

// 4) Make sure the output directory exists.
mkdirSync(dirname(OUT_PATH), { recursive: true });

// 5) Pipe the Web stream directly to a Node write stream (no buffering).
await pipeline(
  Readable.fromWeb(readable as ReadableStream<Uint8Array>),
  createWriteStream(OUT_PATH),
);

console.log("✓ Saved to", OUT_PATH);
