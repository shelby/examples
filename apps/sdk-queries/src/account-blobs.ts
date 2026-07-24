import { AccountAddress, Network } from "@aptos-labs/ts-sdk";
import { ShelbyBlobClient } from "@shelby-protocol/sdk/node";

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

// 2) Parse the account address you'll query.
const account = AccountAddress.fromString(process.env.SHELBY_ACCOUNT_ADDRESS);

// 3) Ask the indexer for every blob owned by that account.
const blobs = await client.getAccountBlobs({ account });

// 4) Print the full metadata for each blob.
console.log(`Account: ${account.toString()}`);
console.log(`Found ${blobs.length} blob(s)`);
console.dir(blobs, { depth: null });
