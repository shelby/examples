# Shelby List Blob Example

An example application demonstrating how to list blobs from the Shelby protocol using the Shelby SDK. This app retrieves and displays all blobs that have been uploaded to a Shelby account.

## Prerequisites

- Node.js >= 22
- pnpm package manager
- A Shelby account with uploaded blobs
- Shelby API key

## Installation

1. Clone the repository and navigate to the list-blob directory:
   ```bash
   cd apps/list-blob
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
```

More information on obtaining an API key on the [Shelby docs site](https://docs.shelby.xyz/sdks/typescript/acquire-api-keys).

## Usage

Run the example using the `bloblist` script:

```bash
pnpm bloblist
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
3. **Account Setup**: Uses the account address from the environment variable
4. **Blob Listing**: Retrieves a list of all blobs associated with the specified Shelby account
5. **Display Results**: Shows blob metadata including name, size, and expiration date

## Output

When successful, this example will:
- Connect to the Shelby network
- Retrieve all blobs from the specified account
- Display the total number of blobs found
- For each blob, show:
  - Blob name
  - File size in bytes
  - Expiration timestamp

Example output:
```
Found 3 blob(s)
· whitepaper.pdf — 1024567 bytes, expires: 2025-10-16T15:30:00.000Z
· document.txt — 2048 bytes, expires: 2025-10-17T10:45:00.000Z
· image.png — 512000 bytes, expires: 2025-10-18T08:20:00.000Z
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

3. **No blobs found**
   - Verify that the account address contains uploaded blobs
   - Check that you're using the correct account address
   - Ensure blobs haven't expired

4. **Rate limit exceeded (429)**
   - Wait a moment before retrying
   - Consider implementing exponential backoff for production use

5. **Server errors (500)**
   - This indicates an issue with the Shelby service
   - Contact Shelby support if this occurs repeatedly
