// ⚠️ This script MUTATES on-chain state: it permanently deletes a blob.
//    Unlike the other scripts here it signs a transaction, so it needs a
//    private key rather than just an account address.

import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyBlobClient } from "@shelby-protocol/sdk/node";

// The blob to delete, as stored in Shelby.
const BLOB_NAME = "sdk-test.txt";

if (!process.env.SHELBY_API_KEY) {
  throw new Error("Missing SHELBY_API_KEY");
}
if (!process.env.SHELBY_ACCOUNT_PRIVATE_KEY) {
  throw new Error("Missing SHELBY_ACCOUNT_PRIVATE_KEY");
}

// 1) Initialize a blob client (auth via API key; target shelbynet).
const client = new ShelbyBlobClient({
  network: Network.SHELBYNET,
  apiKey: process.env.SHELBY_API_KEY, // ensure .env is loaded
});

// 2) Create an Aptos account object from your private key.
//    ⚠️ This must be the *same account* that uploaded the blob.
const signer = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.SHELBY_ACCOUNT_PRIVATE_KEY),
});

// 3) Submit the delete transaction.
const { transaction } = await client.deleteBlob({
  account: signer,
  blobName: BLOB_NAME,
});

console.log("Delete transaction submitted!");
console.log("Hash:", transaction.hash);
