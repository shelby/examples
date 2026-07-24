import { Network } from "@aptos-labs/ts-sdk";
import { ShelbyPlacementGroupClient } from "@shelby-protocol/sdk/node";

// How many slots to fetch in one page.
const PAGE_SIZE = 10;

if (!process.env.SHELBY_API_KEY) {
  throw new Error("Missing SHELBY_API_KEY");
}

// 1) Initialize a placement group client (auth via API key; target shelbynet).
//    Placement groups are network-wide, so no account address is needed.
const client = new ShelbyPlacementGroupClient({
  network: Network.SHELBYNET,
  apiKey: process.env.SHELBY_API_KEY, // ensure .env is loaded
});

// 2) Fetch a page of placement group slots.
const slots = await client.getPlacementGroupSlots({
  pagination: { limit: PAGE_SIZE },
});

console.log(`Found ${slots.length} placement group slot(s)`);
console.dir(slots, { depth: null });
