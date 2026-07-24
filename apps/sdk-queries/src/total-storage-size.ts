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

// 3) Sum the size of every blob the account owns, server-side.
//    Omit `where` to get the total across the whole network.
const totalSize = await client.getTotalBlobsSize({
  where: { owner: { _eq: account.toString() } },
});

console.log(`Total blob size: ${totalSize} bytes`);
