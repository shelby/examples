# Shelby Cross-Chain Accounts Example

This example demonstrates how one can upload and view files using cross-chain (non-Aptos) wallets on the Shelby network.

Checkout the live deployed dapp on:
https://shelby-x-chain-accounts-example.vercel.app/

### Prerequisites

- `node` and `pnpm`
- Shelby API key. For best performance, you are encouraged to generate an API key so your app will not hit the rate limit.
  - Head to [Geomi](https://geomi.dev/) to generate an API key for `shelbynet` and add it to the `.env` file as `NEXT_PUBLIC_SHELBY_API_KEY=<my-api-key>`

### Starting the Demo dApp

Create an `.env` file by copying the `.env.example` file and fill out the required variables.

```bash
cp .env.example .env
```

Then install dependencies and run the dapp locally

```bash
pnpm install
pnpm run dev
```

### Implementation Details

The dApp provides a flow to connect an Aptos native or cross-chain wallet, upload a static file to the Shelby network, and view the account's uploaded files through a user interface.

### Upload a File

At a high level, uploading a file to Shelby includes 3 steps:

1. Encode the File
2. Register the file on chain (transaction submission)
3. Upload the file to Shelby RPC

#### Encode File

Encoding a file means we split the file into chunks, where each chunk has a `commitment hash`, and these are combined to make the `blob merkle root hash`.

We then send all these hashes to the blockchain so they can be verified with the storage providers.

```ts
export const encodeFile = async (file: File): Promise<BlobCommitments> => {
  // Make sure data is a Buffer
  const data = Buffer.isBuffer(file)
    ? file
    : Buffer.from(await file.arrayBuffer());

  // Create provider for direct use with generateCommitments
  const provider = await ClayErasureCodingProvider.create();

  // Generate a commitment
  const commitments = await generateCommitments(provider, data);

  return commitments;
};
```

#### Register the file on the Aptos chain (transaction submission)

> Note: To upload a file to the Shelby network, the account should hold shelbyUSD tokens (1 shelbyUSD for 1 upload). Make sure to fund your account by going to https://docs.shelby.xyz/apis/faucet/shelbyusd

After we have the commitment hashes of the file, we can register the file on chain by submitting a transaction.

```ts
// Generate the transaction payload
const payload = ShelbyBlobClient.createRegisterBlobPayload({
  account: account.address,
  blobName: file.name,
  blobMerkleRoot: commitment.blob_merkle_root,
  numChunksets: expectedTotalChunksets(commitment.raw_data_size),
  expirationMicros: (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000, // 30 days from now in microseconds
  blobSize: commitment.raw_data_size,
});
```

Once we have the transaction payload, we can submit it to the Aptos chain. As mentioned before, in this example we support both Aptos native and cross-chain wallet transaction submissions.

##### Aptos native wallets

> Note: Make sure your wallet is configured to use the `shelbynet` network. Petra (and some other wallets) lets you create a custom network, use those values
>
> - Node URL: https://api.shelbynet.shelby.xyz/v1
> - Faucet URL: https://faucet.shelbynet.shelby.xyz (APT faucet)
> - Indexer URL: https://api.shelbynet.shelby.xyz/v1/graphql

```ts
import {
  type InputTransactionData,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";

const { signAndSubmitTransaction } = useWallet();
// Send the transaction to the connected wallet to sign and submit
const transaction: InputTransactionData = {
  data: payload,
};
const transactionSubmitted = await signAndSubmitTransaction(transaction);
// Wait for transaction to be submitted on the chain
await getAptosClient().waitForTransaction({
  transactionHash: transactionSubmitted.hash,
});
```

##### Cross-chain wallets

Following the [cross-chain wallet docs](https://aptos.dev/build/sdks/wallet-adapter/x-chain-accounts#submitting-a-transaction), it is recommended to sponsor the transaction as we can assume a cross-chain wallet does not have APT to pay the transaction fees.

```ts
import {
  type InputTransactionData,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";

const { signTransaction } = useWallet();

// Create the sponsor account
const privateKey = new Ed25519PrivateKey(
  PrivateKey.formatPrivateKey(
    process.env.NEXT_PUBLIC_SPONSOR_PRIVATE_KEY as string,
    PrivateKeyVariants.Ed25519
  )
);
const sponsorAccount = Account.fromPrivateKey({ privateKey });

// Build the transaction
const rawTransaction = await getAptosClient().transaction.build.simple({
  sender: account.address,
  data: payload, // the payload we generated in the previous step
  withFeePayer: true,
});

// Send the transaction to the connected (cross-chain) wallet to sign
const walletSignedTransaction = await signTransaction({
  transactionOrPayload: rawTransaction,
});

// Sponsor signs the transaction
const sponsorAuthenticator = getAptosClient().transaction.signAsFeePayer({
  signer: sponsorAccount,
  transaction: rawTransaction,
});

// Submit the transaction to chain
const transactionSubmitted = await getAptosClient().transaction.submit.simple({
  transaction: rawTransaction,
  senderAuthenticator: walletSignedTransaction.authenticator,
  feePayerAuthenticator: sponsorAuthenticator,
});

// Wait for transaction to be submitted on the chain
await getAptosClient().waitForTransaction({
  transactionHash: transactionSubmitted.hash,
});
```

#### Upload the file to Shelby RPC

After we submit the transaction and register the commitment hashes on the chain, we can upload the file to the Shelby RPC so it can be verified with the storage providers to ensure that the uploaded data matches the one on the blockchain by comparing the hashes.

> Note: The RPC will make checks on-chain to ensure the file is there first, which is why registration can't happen in parallel with an upload to the RPC.

```ts
await getShelbyClient().rpc.putBlob({
  account: account.address,
  blobName: file.name,
  blobData: new Uint8Array(await file.arrayBuffer()),
});
```

### View the account's uploaded files

To view the files uploaded by an account, we can simply query for the blobs.

```ts
const getBlobs = async (): Promise<BlobMetadata[]> => {
  const blobs = await getShelbyClient().coordination.getAccountBlobs({
    account: account.address,
  });
  return blobs;
};
```
