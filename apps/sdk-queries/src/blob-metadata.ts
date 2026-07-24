import { AccountAddress, Network } from "@aptos-labs/ts-sdk";
import { ShelbyBlobClient } from "@shelby-protocol/sdk/node";

// The blob name as stored in Shelby (must match what you uploaded or already have).
const BLOB_NAME = "sdk-test.txt";

if (!process.env.SHELBY_API_KEY) {
  throw new Error("Missing SHELBY_API_KEY");
}
if (!process.env.SHELBY_ACCOUNT_ADDRESS) {
  throw new Error("Missing SHELBY_ACCOUNT_ADDRESS");
}

// 1) Initialize a blob client (auth via API key; target shelbynet).
const client = new ShelbyBlobClient({
  network: Network.SHELBYNET,
  apiKey: process.env.SHELBY_API_KEY, // ensure .env is loaded
});

// 2) Parse the account address the blob lives under.
const account = AccountAddress.fromString(process.env.SHELBY_ACCOUNT_ADDRESS);

// 3) Look up the on-chain metadata for a single blob.
//    ⚠️ Returns `undefined` when no blob with that name exists.
const metadata = await client.getBlobMetadata({ account, name: BLOB_NAME });

// 4) Print the metadata (or say so when the blob isn't there).
if (!metadata) {
  console.log(`No blob named "${BLOB_NAME}" found for ${account.toString()}`);
} else {
  console.dir(metadata, { depth: null });
}
