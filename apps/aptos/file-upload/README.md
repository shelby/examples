# Aptos File Upload Example

A Next.js example application demonstrating how Aptos developers can build a file upload dApp on [Shelby Protocol](https://shelby.xyz). This app allows users to connect their Aptos wallet and upload files to decentralized storage.

## Features

- Connect Aptos wallets via [@aptos-labs/wallet-adapter-react](https://www.npmjs.com/package/@aptos-labs/wallet-adapter-react)
- Upload files to Shelby's decentralized storage
- Native Aptos address as storage account (no derivation needed)
- Clean UI with file selection and upload status

## Prerequisites

- [Node.js](https://nodejs.org/) v22 or higher
- [pnpm](https://pnpm.io/) package manager
- An Aptos wallet (e.g., Petra, Nightly)
- A Shelby API key

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/shelby-protocol/shelby-examples.git
cd shelby-examples/apps/aptos/file-upload
```

### 2. Install Dependencies

From the monorepo root:

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

### 5. Fund Your Account

Testnet tokens (APT and ShelbyUSD) are available through the [Shelby Discord](https://discord.gg/shelbyserves).

### 6. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

This example uses the following packages:

- [`@shelby-protocol/sdk`](https://docs.shelby.xyz/sdks/typescript) - Core TypeScript SDK for interacting with Shelby Protocol
- [`@shelby-protocol/react`](https://docs.shelby.xyz/sdks/typescript) - React hooks for blob uploads
- [`@aptos-labs/wallet-adapter-react`](https://www.npmjs.com/package/@aptos-labs/wallet-adapter-react) - Aptos wallet connection

### Key Components

- **FileUpload** - Main component handling file selection and upload
- **Header** - Navigation with wallet connection button
- **WalletButton** - Wallet connection with AIP-62 wallet detection
- **providers.tsx** - AptosWalletAdapterProvider and QueryClientProvider configuration

### Storage Account

With Aptos, your wallet address is directly used as your Shelby storage account. No derivation is needed unlike Ethereum or Solana cross-chain flows.

## Learn More

- [Shelby Documentation](https://docs.shelby.xyz)
- [Shelby Explorer](https://explorer.shelby.xyz) - View your uploaded files

## License

MIT
