# Shelby Upload Blob Example

An example application demonstrating how to upload blobs using the Shelby SDK. This app uploads a specified file to a Shelby account and stores it on the Shelby network.

## Prerequisites

- Node.js >= 22
- pnpm package manager
- A Shelby account with sufficient balance for blob storage
- Shelby API key
- Shelby account private key

## Installation

1. Clone the repository and navigate to the upload-blob directory:
   ```bash
   cd apps/upload-blob
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
SHELBY_ACCOUNT_PRIVATE_KEY=your_private_key_here
SHELBY_API_KEY=your_api_key_here
```

More information on obtaining an API key on the [Shelby docs site](https://docs.shelby.xyz/sdks/typescript/acquire-api-keys).

## Configuration

The example is currently configured to upload a file named `whitepaper.pdf` from the `assets/` directory. You can modify this by changing the configuration constants in `src/index.ts`:

```typescript
// The file to upload (relative to cwd).
const UPLOAD_FILE = join(process.cwd(), "assets", "whitepaper.pdf");
// How long before the upload expires (in microseconds from now).
const TIME_TO_LIVE = 60 * 60 * 1_000_000;
// The blob name to use in Shelby (can be different from the local file name).
const BLOB_NAME = "whitepaper.pdf";
```

## Usage

Run the example using the `upload` script:

```bash
pnpm upload
```

This will execute the TypeScript file directly using tsx with the environment variables from your `.env` file.

### Alternative Execution

You can also run the TypeScript file directly using tsx:

```bash
npx tsx --env-file=.env src/index.ts
```

## How It Works

1. **Environment Validation**: The app first validates that all required environment variables are set
2. **Client Initialization**: Creates a Shelby client instance connected to the Shelbynet network
3. **Account Setup**: Creates a signer using the private key from the environment variable
4. **File Reading**: Reads the specified file from the local filesystem
5. **Blob Upload**: Uploads the file to the Shelby account with the specified name and expiration time
6. **Success Confirmation**: Prints a success message when the upload completes

## Output

When successful, this example will:
- Read the file from the `assets/` directory
- Upload the blob to your Shelby account
- Set an expiration time for the blob (1 hour by default)
- Print progress messages to the console

## Troubleshooting

### Common Issues

1. **SHELBY_ACCOUNT_PRIVATE_KEY is not set in .env**
   - Verify your private key is correctly set in the `.env` file
   - Ensure there are no extra spaces or quotes around the private key

2. **SHELBY_API_KEY is not set in .env**
   - Verify your API key is correctly set in the `.env` file
   - Ensure there are no extra spaces or quotes around the API key

3. **Blob already exists (EBLOB_WRITE_CHUNKSET_ALREADY_EXISTS)**
   - This blob has already been uploaded to your account
   - Consider changing the `BLOB_NAME` or deleting the existing blob first

4. **Insufficient balance for transaction fee (INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE)**
   - Your account doesn't have enough APT to pay for the transaction fee
   - Add more APT tokens to your account using [the faucet](https://docs.shelby.xyz/apis/faucet/aptos)

5. **Insufficient funds for blob storage (EBLOB_WRITE_INSUFFICIENT_FUNDS)**
   - Your account doesn't have enough Shelby tokens to pay for blob storage
   - Add more Shelby tokens to your account using [the faucet](https://docs.shelby.xyz/apis/faucet/shelbyusd)

6. **Rate limit exceeded (429)**
   - Wait a moment before retrying
   - Consider implementing exponential backoff for production use

7. **Server errors (500)**
   - This indicates an issue with the Shelby service
   - Contact Shelby support if this occurs repeatedly

## File Requirements

- The example file `whitepaper.pdf` is included in the `assets/` directory
- You can replace this file with any file you want to upload
- Make sure to update the `UPLOAD_FILE` and `BLOB_NAME` constants accordingly
