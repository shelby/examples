# Shelby Batch Upload Example

An example application demonstrating how to upload multiple files to Shelby in a single run. Place your files in the `assets/` directory and the script will upload them all sequentially.

## Prerequisites

- Node.js >= 22
- pnpm package manager
- A Shelby account with sufficient balance for blob storage
- Shelby API key
- Shelby account private key

## Installation

1. Clone the repository and navigate to the batch-upload directory:
   ```bash
   cd apps/batch-upload
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

You can modify the behavior by changing the configuration constants in `src/index.ts`:

```typescript
// Directory containing files to upload.
const UPLOAD_DIR = join(process.cwd(), "assets");
// How long before each upload expires (in microseconds from now).
const TIME_TO_LIVE = 60 * 60 * 1_000_000; // 1 hour
// Optional prefix for blob names on Shelby.
const BLOB_PREFIX = "";
```

## Usage

1. Place files you want to upload in the `assets/` directory (sample files are included).

2. Run the batch upload:
   ```bash
   pnpm upload
   ```

### Example Output

```
Found 2 file(s) to upload

  Uploading hello.txt (41 B)... done
  Uploading sample.json (89 B)... done

✓ 2 uploaded, 0 failed
```

## How It Works

1. **Environment Validation**: Validates that all required environment variables are set
2. **Client Initialization**: Creates a Shelby client instance connected to the Shelbynet network
3. **File Discovery**: Scans the `assets/` directory for all files (hidden files are excluded)
4. **Sequential Upload**: Uploads each file to Shelby with the configured expiration time
5. **Error Handling**: Gracefully handles errors per file — if one upload fails, the rest continue
6. **Duplicate Detection**: Skips files that already exist on Shelby instead of failing

## Troubleshooting

### Common Issues

1. **No files found**
   - Ensure your files are placed directly in the `assets/` directory
   - Hidden files (starting with `.`) are excluded by default

2. **Blob already exists**
   - The script automatically skips existing blobs and counts them as successful

3. **Insufficient balance**
   - Fund your account using the [ShelbyUSD faucet](https://docs.shelby.xyz/apis/faucet/shelbyusd) and [APT faucet](https://docs.shelby.xyz/apis/faucet/aptos)

4. **Rate limit exceeded (429)**
   - Wait a moment before retrying
   - Consider obtaining your own API key for higher limits
