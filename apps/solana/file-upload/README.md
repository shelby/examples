# Solana File Upload Example

A Next.js example application demonstrating how Solana developers can build a file upload dApp on [Shelby Protocol](https://shelby.xyz). This app allows users to connect their Solana wallet and upload files to decentralized storage.

## Features

- Connect Solana wallets via [@solana/react-hooks](https://www.npmjs.com/package/@solana/react-hooks)
- Upload files to Shelby's decentralized storage
- Automatic storage account derivation from Solana address
- Clean UI with drag-and-drop file uploads

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [pnpm](https://pnpm.io/) package manager
- A Solana wallet (e.g., Phantom, Solflare)
- A Shelby API key

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/shelby-protocol/shelby-examples.git
cd shelby-examples/apps/solana/file-upload
```

### 2. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

Or from this directory:

```bash
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

### 4. Get Your Shelby API Key

1. Visit the [Shelby API Keys documentation](https://docs.shelby.xyz/sdks/typescript/acquire-api-keys)
2. Follow the instructions to acquire your API key
3. Add your API key to the `.env` file:

```env
NEXT_PUBLIC_SHELBY_API_KEY=your-api-key-here
```

### 5. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

This example uses the following Shelby packages:

- [`@shelby-protocol/sdk`](https://docs.shelby.xyz/sdks/typescript) - Core TypeScript SDK for interacting with Shelby Protocol
- [`@shelby-protocol/solana-kit`](https://docs.shelby.xyz/sdks/solana-kit/react) - Solana-specific utilities for wallet integration
- [`@shelby-protocol/react`](https://docs.shelby.xyz/sdks/typescript) - React hooks for blob uploads

### Key Components

- **FileUpload** - Main component handling file selection and upload
- **Header** - Navigation with wallet connection button
- **WalletButton** - Wallet connection using @solana/react-hooks
- **providers.tsx** - SolanaProvider and QueryClientProvider configuration

### Storage Account

When you connect your Solana wallet, a Shelby storage account is automatically derived from your Solana address. This allows you to upload and manage files using your existing wallet.

## Learn More

- [Shelby Documentation](https://docs.shelby.xyz)
- [Solana Kit React Reference](https://docs.shelby.xyz/sdks/solana-kit/react)
- [Shelby Explorer](https://explorer.shelby.xyz) - View your uploaded files

## License

MIT
