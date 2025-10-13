import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";

// The file to upload (relative to cwd).
const UPLOAD_FILE = join(process.cwd(), "assets", "whitepaper.pdf");
// How long before the upload expires (in microseconds from now).
const TIME_TO_LIVE = 60 * 60 * 1_000_000;
// The blob name to use in Shelby (can be different from the local file name).
const BLOB_NAME = "whitepaper.pdf";

if (!process.env.SHELBY_ACCOUNT_PRIVATE_KEY) {
  throw new Error("Missing SHELBY_ACCOUNT_PRIVATE_KEY");
}
if (!process.env.SHELBY_API_KEY) {
  throw new Error("Missing SHELBY_API_KEY");
}

// 1) Initialize a Shelby client (auth via API key; target shelbynet).
const client = new ShelbyNodeClient({
  network: Network.SHELBYNET,
  apiKey: process.env.SHELBY_API_KEY,
});

// 2) Create an Aptos account object from your private key.
const signer = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.SHELBY_ACCOUNT_PRIVATE_KEY),
});

// 3) Upload the blob to Shelby (reads the file fully into memory first).
await client.upload({
  blobData: readFileSync(UPLOAD_FILE),
  signer,
  blobName: BLOB_NAME,
  expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
});

console.log("✓ Uploaded", BLOB_NAME, "successfully.");
