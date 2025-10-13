# Shelby Download Blob Example

An example application demonstrating how to download blobs from the Shelby protocol using the Shelby SDK. This app downloads the specified blob from a Shelby account and saves it to the local filesystem.

## Prerequisites

- Node.js >= 22
- npm, yarn, or pnpm package manager
- A Shelby account with uploaded blobs
- Shelby API key

## Installation

1. Clone the repository and navigate to the download-blob directory:
   ```bash
   cd apps/download-blob
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
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

## Configuration

The example is currently configured to download a blob named `whitepaper.pdf`. You can modify this by changing the `BLOB_NAME` constant in `src/index.ts`:

```typescript
const BLOB_NAME = "your-blob-name.ext" // Change this to your desired blob name
```

## Usage

Run the example using the start script:

```bash
npm start
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
4. **Blob Download**: Downloads the specified blob from the Shelby account
5. **File Saving**: Saves the downloaded blob to the `downloads/` directory in the current working directory

## Output

When successful, this example will:
- Create a `downloads/` directory if it doesn't exist
- Download the blob from Shelby
- Save the file as `downloads/whitepaper.pdf` (or whatever `BLOB_NAME` you specified)
- Print progress messages to the console

## Troubleshooting

### Common Issues

1. **SHELBY_ACCOUNT_ADDRESS is not set in .env**
   - Ensure you have created a `.env` file with the required variables
   - Check that the variable name is spelled correctly

2. **SHELBY_API_KEY is not set in .env**
   - Verify your API key is correctly set in the `.env` file
   - Ensure there are no extra spaces or quotes around the API key

3. **Blob not found (404)**
   - Verify that the blob name specified in `BLOB_NAME` exists in your Shelby account
   - Check that the blob name matches exactly
   - Ensure you're using the correct account address that contains the blob

4. **Rate limit exceeded (429)**
   - Wait a moment before retrying
   - Consider implementing exponential backoff for production use

5. **Server errors (500)**
   - This indicates an issue with the Shelby service
   - Contact Shelby support if this occurs repeatedly
