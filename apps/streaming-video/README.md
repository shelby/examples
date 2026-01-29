# Shelby Streaming Video Example

This example demonstrates how to build a video streaming application with decentralized content gating using the Shelby Protocol.

## Key Features

- **Real-time Streaming**: Utilizes Shelby SDK's `streamData` for low-latency video playback.
- **On-chain Gating**: Protects premium content with rules stored on-chain (Aptos/Solana).
- **Micropayments**: Integrated "Tip-to-Unlock" flow for content monetization.
- **Wallet Integration**: Seamless connection with Aptos wallets (Petra, etc.).
...
2. **Access Rules**: Creators set a price (e.g., 0.5 APT) and their wallet address receives payments directly.

## Getting Started

### 1. Installation

Install dependencies from the root of the monorepo:

```bash
pnpm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required variables:
- `NEXT_PUBLIC_SHELBY_API_KEY`: Your Shelby Protocol API key.
- `NEXT_PUBLIC_APTOS_API_KEY`: Aptos network API key.

### 3. Development

Run the development server:

```bash
pnpm dev --filter=@shelby-protocol/streaming-video
```

Open [http://localhost:3005](http://localhost:3005) to view the app.

## How it Works

1. **Content Upload**: Videos are encrypted and uploaded as blobs to Shelby storage.
2. **Access Rules**: A access policy is set (e.g., "Must pay 0.1 APT to address X").
3. **Streaming**: When a user visits the page, the app checks for the payment. If not found, the `VideoPlayer` displays a lock screen.
4. **Unlocking**: Upon payment, the Shelby SDK provides the authorized stream to the browser.

## Built With

- [Next.js](https://nextjs.org/)
- [Shelby SDK](https://docs.shelby.xyz)
- [React Player](https://github.com/cookpete/react-player)
- [Tailwind CSS](https://tailwindcss.com/)
