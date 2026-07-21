import { ShelbyBlobClient } from "@shelby-protocol/sdk/node";
import {
  Account,
  Ed25519PrivateKey,
  Network,
} from "@aptos-labs/ts-sdk";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

async function main() {
  const account = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY),
  });

  const client = new ShelbyBlobClient({
    network: Network.SHELBYNET,
    apiKey: process.env.SHELBY_API_KEY,
  });

  const totalSize = await client.getTotalBlobsSize({
    where: {
      owner: {
        _eq: account.accountAddress.toString(),
      },
    },
  });

  console.log(`Total blob size: ${totalSize} bytes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
