# Shelby SDK Query Examples

A collection of small, self-contained scripts demonstrating how to read data from the Shelby protocol using the Shelby SDK. Each script is one file in `src/` and answers a single question — how many blobs does this account own, what is stored under a given name, which storage providers are serving the network, and so on.

Most of these queries hit the Shelby indexer and are read-only, so they need nothing more than an account address and an API key. The one exception is `delete-blob`, which signs an on-chain transaction.

## Prerequisites

- Node.js >= 22
- pnpm package manager
- A Shelby account with uploaded blobs
- Shelby API key

## Installation

1. Clone the repository and navigate to the sdk-queries directory:
   ```bash
   cd apps/sdk-queries
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

## Environment Variables

Create a `.env` file in the root of this project directory with the following required environment variables. You can copy the `.env.example` file as a starting point:

```bash
cp .env.example .env
```

Then update the values in your `.env` file:

```env
SHELBY_ACCOUNT_ADDRESS=your_account_address_here
SHELBY_API_KEY=your_api_key_here

# Only required by the delete-blob script.
SHELBY_ACCOUNT_PRIVATE_KEY=your_private_key_here
```

More information on obtaining an API key on the [Shelby docs site](https://docs.shelby.xyz/sdks/typescript/acquire-api-keys).

## Usage

Each query has its own script. Run whichever one you're interested in:

| Script | File | What it does |
| --- | --- | --- |
| `pnpm query:blobs` | `src/account-blobs.ts` | Lists every blob owned by the account, with full metadata |
| `pnpm query:metadata` | `src/blob-metadata.ts` | Fetches the on-chain metadata for a single named blob |
| `pnpm query:blob-count` | `src/blob-count.ts` | Counts the account's blobs without fetching them |
| `pnpm query:storage-size` | `src/total-storage-size.ts` | Sums the byte size of everything the account stores |
| `pnpm query:activities` | `src/blob-activities.ts` | Shows the account's blob activity log |
| `pnpm query:activities-count` | `src/blob-activities-count.ts` | Counts activity records for the account |
| `pnpm query:placement-groups` | `src/placement-groups.ts` | Lists a page of network placement group slots |
| `pnpm query:placement-group-count` | `src/placement-group-count.ts` | Counts placement group slots network-wide |
| `pnpm query:storage-providers` | `src/storage-providers.ts` | Lists the storage providers serving the network |
| `pnpm delete-blob` | `src/delete-blob.ts` | ⚠️ Permanently deletes a blob (mutates on-chain state) |

Each runs the TypeScript file directly using tsx with the environment variables from your `.env` file.

### Alternative Execution

You can also run any of the files directly using tsx:

```bash
npx tsx --env-file=.env src/account-blobs.ts
```

### Customizing the queries

Two scripts act on a specific blob name, set as a constant at the top of the file:

```ts
const BLOB_NAME = "sdk-test.txt";
```

Change that to a blob your account actually owns before running `query:metadata` or `delete-blob`.

The count and list queries accept a Hasura-style `where` clause, so they can be narrowed beyond "everything this account owns". For example, to count only blobs owned by someone else:

```ts
const count = await client.getBlobsCount({
  where: { owner: { _eq: "0x1" } },
});
```

## How It Works

1. **Environment Validation**: Each script validates that the environment variables it needs are set
2. **Client Initialization**: Creates the client for the data being queried — `ShelbyBlobClient` for blobs and activities, `ShelbyPlacementGroupClient` for placement groups, `ShelbyMetadataClient` for storage providers
3. **Account Setup**: Parses the account address from the environment variable (`delete-blob` builds a signing account from a private key instead)
4. **Query**: Issues a single SDK call — the list and count variants are separate methods, so counts never transfer the underlying rows
5. **Display Results**: Prints scalars directly, and object results via `console.dir` with unlimited depth

## Output

Counting queries print a single line:

```
Blob count: 3
```

```
Total blob size: 1539615 bytes
```

Listing queries print a summary line followed by the full objects:

```
Account: 0x1234...abcd
Found 3 blob(s)
[
  {
    name: 'whitepaper.pdf',
    size: 1024567,
    expirationMicros: 1760628600000000,
    ...
  },
  ...
]
```

And `delete-blob` prints the submitted transaction:

```
Delete transaction submitted!
Hash: 0x9f8e...
```

## Troubleshooting

### Common Issues

1. **SHELBY_ACCOUNT_ADDRESS is not set in .env**
   - Ensure you have created a `.env` file with the required variables
   - Check that the variable name is spelled correctly
   - Verify the account address format is valid

2. **SHELBY_API_KEY is not set in .env**
   - Verify your API key is correctly set in the `.env` file
   - Ensure there are no extra spaces or quotes around the API key

3. **No blob named "..." found**
   - `getBlobMetadata` returns `undefined` rather than throwing when the blob doesn't exist
   - Update the `BLOB_NAME` constant to a blob the account actually owns
   - Run `pnpm query:blobs` to see which names are available

4. **Empty results from every query**
   - Verify that the account address contains uploaded blobs
   - Check that you're using the correct account address
   - Ensure blobs haven't expired

5. **Rate limit exceeded (429)**
   - Wait a moment before retrying
   - Consider implementing exponential backoff for production use

6. **Server errors (500)**
   - This indicates an issue with the Shelby service
   - Contact Shelby support if this occurs repeatedly
