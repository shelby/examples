import { Network } from "@aptos-labs/ts-sdk";
import { ShelbyPlacementGroupClient } from "@shelby-protocol/sdk/node";

if (!process.env.SHELBY_API_KEY) {
  throw new Error("Missing SHELBY_API_KEY");
}

// 1) Initialize a placement group client (auth via API key; target shelbynet).
const client = new ShelbyPlacementGroupClient({
  network: Network.SHELBYNET,
  apiKey: process.env.SHELBY_API_KEY, // ensure .env is loaded
});

// 2) Count every slot on the network. Pass a `where` clause to narrow it down,
//    e.g. { where: { status: { _eq: "active" } } }.
const count = await client.getPlacementGroupSlotsCount({});

console.log(`Placement group slot count: ${count}`);
