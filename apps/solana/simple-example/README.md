# Shelby Solana Kit Example

This example demonstrates how to use `@shelby-protocol/solana-kit` to upload blobs to Shelby storage using Solana keypairs.

## Overview

The Solana Kit provides a native Solana integration for Shelby's decentralized storage. It allows you to:

1. Create storage accounts derived from Solana keypairs
2. Fund accounts with ShelbyUSD (upload fees) and APT (transaction fees)
3. Upload blobs to Shelby storage
4. Delete blobs from Shelby storage

## How It Works

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  1. Connect │───▶│ 2. Create Storage│───▶│  3. Fund with   │───▶│ 4. Upload/Delete│
│   Wallet    │    │     Account      │    │ ShelbyUSD + APT │    │     Blobs       │
└─────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Concepts

- **Storage Account**: A Shelby account derived from a Solana keypair and a domain. The domain acts as a namespace for your blobs.
- **ShelbyUSD**: The token used to pay for storage fees.
- **APT**: Used to pay for transaction fees on the Shelby network.

## Project Structure

```
app/
├── page.tsx                    # Main orchestrator
├── api/
│   ├── create-storage-account/ # Create storage account
│   ├── fund-account/           # Fund with ShelbyUSD + APT
│   ├── upload-blob/            # Upload blob
│   └── delete-blob/            # Delete blob
components/
├── WalletProvider.tsx          # Solana wallet setup
├── StorageAccountManager.tsx   # Keypair, domain, create, fund
└── BlobUploader.tsx            # Upload, list, delete blobs
hooks/
├── useCreateStorageAccount.ts  # Create storage account hook
├── useFundAccount.ts           # Fund account hook
├── useUploadBlob.ts            # Upload blob hook
└── useDeleteBlob.ts            # Delete blob hook
utils/
└── client.ts                   # Singleton Shelby client
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A Solana wallet (like Phantom or Solflare)

### Environment Variables

Create a `.env.local` file:

```env
SHELBY_API_KEY=your_api_key
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
```

### Installation

```bash
# From the monorepo root
pnpm install

# Run the development server
pnpm --filter @shelby-protocol/solana-kit dev
```

The app will be available at [http://localhost:3002](http://localhost:3002).

## Usage Flow

1. **Connect Wallet**: Connect your Solana wallet (Phantom, Solflare, etc.)

2. **Create Storage Account**:
   - A new Solana keypair is generated
   - Enter a domain for your storage namespace
   - The storage account address is derived from the keypair + domain

3. **Fund Account**:
   - Fund with ShelbyUSD for upload fees
   - Fund with APT for transaction fees
   - Uses Shelby devnet faucets for development

4. **Upload Blobs**:
   - Select a file to upload
   - The blob is uploaded to Shelby devnet
   - Get a URL for your blob

5. **Delete Blobs**:
   - Remove blobs you no longer need
   - Transaction is submitted to the Shelby network

## API Routes Reference

### Create Storage Account

`POST /api/create-storage-account`

Creates a storage account derived from a Solana keypair and domain.

```typescript
// app/api/create-storage-account/route.ts
const storageAccount = shelbyClient.createStorageAccount(keypair, domain);

// Response
{
  success: true,
  storageAccountAddress: "0x...",
  solanaPublicKey: "..."
}
```

### Fund Account

`POST /api/fund-account`

Funds the storage account with ShelbyUSD and/or APT tokens.

```typescript
// app/api/fund-account/route.ts
await shelbyClient.fundAccountWithShelbyUSD({
  address: storageAccount.accountAddress,
  amount: shelbyUsdAmount,
});

await shelbyClient.fundAccountWithAPT({
  address: storageAccount.accountAddress,
  amount: aptAmount,
});

// Response
{
  success: true,
  storageAccountAddress: "0x...",
  funded: { shelbyUsd: true, apt: true }
}
```

### Upload Blob

`POST /api/upload-blob`

Uploads blob data to Shelby storage.

```typescript
// app/api/upload-blob/route.ts
const expirationMicros = Date.now() * 1000 + expirationDays * 24 * 60 * 60 * 1000 * 1000;

await shelbyClient.upload({
  blobData: new Uint8Array(blobData),
  signer: storageAccount,
  blobName,
  expirationMicros,
});

const blobUrl = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${storageAccount.accountAddress}/${blobName}`;

// Response
{
  success: true,
  blobName: "example.txt",
  blobUrl: "https://api.shelbynet.shelby.xyz/shelby/v1/blobs/0x.../example.txt",
  storageAccountAddress: "0x...",
  expirationMicros: 1234567890000000
}
```

### Delete Blob

`POST /api/delete-blob`

Deletes a blob from Shelby storage.

```typescript
// app/api/delete-blob/route.ts
import { ShelbyBlobClient } from "@shelby-protocol/sdk/node";

// Create delete payload
const payload = ShelbyBlobClient.createDeleteBlobPayload({
  blobNameSuffix: blobName,
});

// Build, sign, and submit transaction
const transaction = await shelbyClient.aptos.transaction.build.simple({
  sender: storageAccount.accountAddress,
  data: payload,
});

const authenticator = storageAccount.signTransactionWithAuthenticator(transaction);
const response = await shelbyClient.aptos.transaction.submit.simple({
  transaction,
  senderAuthenticator: authenticator,
});

await shelbyClient.aptos.waitForTransaction({
  transactionHash: response.hash,
});

// Response
{
  success: true,
  blobName: "example.txt",
  transactionHash: "0x..."
}
```

## Custom Hooks

React hooks for interacting with Shelby storage from client components.

### useCreateStorageAccount

```typescript
import { useCreateStorageAccount } from "@/hooks/useCreateStorageAccount";

const { createStorageAccount, isCreating, error } = useCreateStorageAccount();

const result = await createStorageAccount(keypair.secretKey, "my-domain.com");
// result: { storageAccountAddress: string, solanaPublicKey: string }
```

### useFundAccount

```typescript
import { useFundAccount } from "@/hooks/useFundAccount";

const { fundAccount, isFunding, error } = useFundAccount();

const result = await fundAccount(
  keypair.secretKey,
  "my-domain.com",
  1_000_000_000, // ShelbyUSD amount
  1_000_000_000  // APT amount
);
// result: { storageAccountAddress: string, funded: { shelbyUsd?: boolean, apt?: boolean } }
```

### useUploadBlob

```typescript
import { useUploadBlob } from "@/hooks/useUploadBlob";

const { uploadBlob, isUploading, error } = useUploadBlob();

const result = await uploadBlob(
  keypair.secretKey,
  "my-domain.com",
  "file.txt",
  new Uint8Array([1, 2, 3]),
  7 // expiration days (default: 1)
);
// result: { blobName: string, blobUrl: string, storageAccountAddress: string, expirationMicros: number }
```

### useDeleteBlob

```typescript
import { useDeleteBlob } from "@/hooks/useDeleteBlob";

const { deleteBlob, isDeleting } = useDeleteBlob();

const result = await deleteBlob(keypair.secretKey, "my-domain.com", "file.txt");
// result: { blobName: string, transactionHash: string }
```

## Code Example

```typescript
import { Network, Shelby } from "@shelby-protocol/solana-kit/node";
import { ShelbyBlobClient } from "@shelby-protocol/sdk/node";
import { Connection, Keypair } from "@solana/web3.js";

// Create a Shelby client
const connection = new Connection("https://api.devnet.solana.com");
const shelbyClient = new Shelby({
  network: Network.SHELBYNET,
  connection,
  apiKey: process.env.SHELBY_API_KEY,
});

// Generate a Solana keypair
const solanaKeypair = Keypair.generate();

// Create a storage account
const domain = "my-awesome-dapp.com";
const storageAccount = shelbyClient.createStorageAccount(solanaKeypair, domain);

// Fund the account
await shelbyClient.fundAccountWithShelbyUSD({
  address: storageAccount.accountAddress,
  amount: 1_000_000_000, // 1 ShelbyUSD
});

await shelbyClient.fundAccountWithAPT({
  address: storageAccount.accountAddress,
  amount: 1_000_000_000, // 1 APT
});

// Upload a blob
const blobName = "example.txt";
await shelbyClient.upload({
  blobData: new Uint8Array([1, 2, 3]),
  signer: storageAccount,
  blobName,
  expirationMicros: Date.now() * 1000 + 86400000000, // 1 day
});

// Blob URL
const blobUrl = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${storageAccount.accountAddress}/${blobName}`;

// Delete a blob
const payload = ShelbyBlobClient.createDeleteBlobPayload({
  blobNameSuffix: blobName,
});

const transaction = await shelbyClient.aptos.transaction.build.simple({
  sender: storageAccount.accountAddress,
  data: payload,
});

const authenticator = storageAccount.signTransactionWithAuthenticator(transaction);
const response = await shelbyClient.aptos.transaction.submit.simple({
  transaction,
  senderAuthenticator: authenticator,
});

await shelbyClient.aptos.waitForTransaction({
  transactionHash: response.hash,
});
```

## Architecture

This example uses a server-side architecture for Shelby operations:

- **Browser**: Handles wallet connection and UI
- **API Routes**: Execute Shelby operations using `@shelby-protocol/solana-kit/node`

```
Browser (React Components)
    │
    │ fetch()
    ▼
API Routes (/api/*)
    │
    │ Shelby SDK
    ▼
Shelby Client (getShelbyClient singleton)
    │
    │ HTTPS
    ▼
Shelby Network (SHELBYNET)
```

## Related Examples

- [cross-chain-accounts](../cross-chain-accounts) - Cross-chain wallet derivation example
- [upload-blob](../upload-blob) - Simple blob upload CLI example
- [download-blob](../download-blob) - Blob download CLI example

## Resources

- [Shelby Documentation](https://docs.shelby.xyz)
- [Solana Kit Documentation](https://docs.shelby.xyz/sdks/solana-kit)
