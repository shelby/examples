import { ShelbyPlacementGroupClient } from "@shelby-protocol/sdk/node";
import { Network } from "@aptos-labs/ts-sdk";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

async function main() {
  const client = new ShelbyPlacementGroupClient({
    network: Network.SHELBYNET,
    apiKey: process.env.SHELBY_API_KEY,
  });

  const slots = await client.getPlacementGroupSlots({
    pagination: {
      limit: 10,
    },
  });

  console.log(`Found ${slots.length} placement group slot(s)\n`);

  console.dir(slots, { depth: null });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
