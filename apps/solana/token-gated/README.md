# Token-Gated Files on Solana

A Next.js example dapp demonstrating how to build an application to upload encrypted files to Shelby and use Solana for payments.

## Overview

This example shows how to build a token-gated content system where:

1. **Sellers** upload encrypted files to Shelby storage and register them on Solana with a price
2. **Buyers** pay in SOL to purchase access, then decrypt and download the files

The encryption uses ACE threshold cryptography—the decryption key is only released when a buyer proves they have purchased access via a signed Solana transaction.

> **Note:** ACE is a temporary access control solution for this example. Once a more production-ready access control system is available, this example will be updated accordingly.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Shelby API key

# Run development server
npm dev
```

Open [http://localhost:3000](http://localhost:3000), connect your wallet (testnet), and try the flow.

## Architecture

### Programs (Solana)

Two Anchor programs handle access control:

| Program          | Address                                        | Purpose                                             |
| ---------------- | ---------------------------------------------- | --------------------------------------------------- |
| `access_control` | `noXndy5tEgNpCz8HDCJpth6RPVqTmmY4G3aesxAxHTx`  | Registers blobs, handles purchases, stores receipts |
| `ace_hook`       | `84w5P5Uqjb5EWrVU2yV81nBA2r4NQi69NZvYnRxWLpnt` | Verifies access for decryption key release          |

### Why Two Programs?

The `ace_hook` program exists so that ACE decryption committee workers can verify that a proof-of-permission transaction calls the correct `assert_access` function. If everything were in one program, there'd be no clean way to verify which instruction was called.

### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        SELLER FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│  1. Generate random cipher key (redKey)                          │
│  2. Encrypt file with redKey → redBox                           │
│  3. Upload redBox to Shelby storage                              │
│  4. Encrypt redKey with ACE threshold IBE → greenBox            │
│  5. Register blob on Solana (greenBox + price)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        BUYER FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│  1. Call purchase() on access_control → creates receipt PDA     │
│  2. Sign assert_access() tx as proof-of-permission              │
│  3. Send signed tx to ACE → receive decryption key              │
│  4. Decrypt greenBox → redKey                                   │
│  5. Fetch redBox from Shelby                                    │
│  6. Decrypt redBox with redKey → original file                  │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
├── anchor/                    # Solana programs (Anchor)
│   ├── programs/
│   │   ├── access_control/    # Blob registration & purchase handling
│   │   └── ace_hook/          # Access verification for decryption
│   └── Anchor.toml
├── app/
│   ├── components/
│   │   ├── file-upload.tsx    # Seller: encrypt & upload
│   │   ├── purchase-card.tsx  # Buyer: purchase & decrypt
│   │   └── providers.tsx      # Solana client setup
│   ├── lib/
│   │   ├── anchor.ts          # Anchor helpers, PDAs, on-chain fetchers
│   │   ├── config.ts          # Program IDs, endpoints
│   │   ├── encryption.ts      # RedBox + GreenBox encryption helpers
│   │   └── utils.ts           # Shared utils (blob names, hex, download)
│   └── page.tsx
└── .env.example
```

## Configuration

Environment variables (see `.env.example`):

```bash
# Required
NEXT_PUBLIC_SHELBYNET_API_KEY=your-api-key

# Optional: override program IDs for custom deployments
NEXT_PUBLIC_ACCESS_CONTROL_PROGRAM_ID=...
NEXT_PUBLIC_ACE_HOOK_PROGRAM_ID=...
```

## Deploy Your Own Programs

The programs are already deployed to testnet. To deploy your own:

### Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://solana.com/docs/intro/installation) configured for testnet
- [Anchor](https://www.anchor-lang.com/docs/installation)

### Steps

1. **Build the programs**

   ```bash
   cd anchor
   anchor build
   ```

2. **Generate new program keypairs**

   ```bash
   solana-keygen new -o target/deploy/access_control-keypair.json
   solana-keygen new -o target/deploy/ace_hook-keypair.json
   ```

3. **Get the new program IDs**

   ```bash
   solana address -k target/deploy/access_control-keypair.json
   solana address -k target/deploy/ace_hook-keypair.json
   ```

4. **Update program IDs in source**
   - `anchor/programs/access_control/src/lib.rs` - `declare_id!(...)`
   - `anchor/programs/ace_hook/src/lib.rs` - `declare_id!(...)`
   - `anchor/Anchor.toml` - `[programs.testnet]` section

5. **Rebuild and deploy**

   ```bash
   anchor build
   anchor deploy --provider.cluster testnet
   ```

6. **Update your `.env`**
   ```bash
   NEXT_PUBLIC_ACCESS_CONTROL_PROGRAM_ID=your-new-access-control-id
   NEXT_PUBLIC_ACE_HOOK_PROGRAM_ID=your-new-ace-hook-id
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.testnet.solana.com
   NEXT_PUBLIC_ACE_CHAIN_NAME=testnet
   ```

## Stack

| Layer            | Technology                                                        |
| ---------------- | ----------------------------------------------------------------- |
| Frontend         | Next.js 16, React 19, TypeScript                                  |
| Styling          | Tailwind CSS v4                                                   |
| Solana Client    | `@solana/client`, `@solana/react-hooks`                           |
| Storage          | Shelby (via `@shelby-protocol/solana-kit`,`@shelby-protocol/sdk`) |
| Threshold Crypto | ACE (`@aptos-labs/ace-sdk`)                                       |
| Programs         | Anchor (Rust)                                                     |

## Learn More

- [Solana Docs](https://solana.com/docs) - core concepts and guides
- [Anchor Docs](https://www.anchor-lang.com/docs) - program development framework
- [Shelby Docs](https://docs.shelby.xyz) - decentralized storage
- [ACE](https://github.com/aptos-labs/ace) - threshold cryptography
