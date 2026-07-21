import { ShelbyMetadataClient } from "@shelby-protocol/sdk/node";
import { Network } from "@aptos-labs/ts-sdk";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const client = new ShelbyMetadataClient({
    network: Network.SHELBYNET,
    apiKey: process.env.SHELBY_API_KEY,
  });

  console.log("Fetching storage providers...\n");

  const providers = await client.getStorageProviders();

  console.log(`Found ${providers.length} storage provider(s)\n`);

  console.dir(providers, { depth: null });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
