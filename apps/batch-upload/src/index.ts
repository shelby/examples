import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";

// Directory containing files to upload.
const UPLOAD_DIR = join(process.cwd(), "assets");
// How long before each upload expires (in microseconds from now).
const TIME_TO_LIVE = 60 * 60 * 1_000_000; // 1 hour
// Optional prefix for blob names on Shelby.
const BLOB_PREFIX = "";

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

// 3) Discover all files in the assets directory.
const files = readdirSync(UPLOAD_DIR)
  .filter((name) => !name.startsWith("."))
  .filter((name) => statSync(join(UPLOAD_DIR, name)).isFile());

if (files.length === 0) {
  console.log("No files found in", UPLOAD_DIR);
  process.exit(0);
}

console.log(`Found ${files.length} file(s) to upload\n`);

// 4) Upload each file sequentially.
let uploaded = 0;
let failed = 0;

for (const file of files) {
  const filePath = join(UPLOAD_DIR, file);
  const blobName = `${BLOB_PREFIX}${file}`;
  const size = statSync(filePath).size;

  try {
    process.stdout.write(`  Uploading ${blobName} (${formatBytes(size)})...`);

    await client.upload({
      blobData: readFileSync(filePath),
      signer,
      blobName,
      expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
    });

    console.log(" done");
    uploaded++;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes("EBLOB_WRITE_CHUNKSET_ALREADY_EXISTS")) {
      console.log(" skipped (already exists)");
      uploaded++;
      continue;
    }

    console.log(" FAILED");
    console.error(`    Error: ${msg}`);
    failed++;
  }
}

console.log(`\n✓ ${uploaded} uploaded, ${failed} failed`);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
