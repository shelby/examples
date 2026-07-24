import { Network } from "@aptos-labs/ts-sdk";
import { ShelbyMetadataClient } from "@shelby-protocol/sdk/node";

if (!process.env.SHELBY_API_KEY) {
  throw new Error("Missing SHELBY_API_KEY");
}

// 1) Initialize a metadata client (auth via API key; target shelbynet).
const client = new ShelbyMetadataClient({
  network: Network.SHELBYNET,
  apiKey: process.env.SHELBY_API_KEY, // ensure .env is loaded
});

// 2) List the storage providers currently serving the network.
console.log("Fetching storage providers...");
const providers = await client.getStorageProviders();

console.log(`Found ${providers.length} storage provider(s)`);
console.dir(providers, { depth: null });
