# Shelby File Sharing Example

A full-stack example demonstrating decentralized file sharing built on the Shelby SDK. Upload any file, receive a unique shareable link, and let anyone download it — every file is SHA-256 hashed and stored on Shelby decentralized hot storage with Aptos blockchain provenance.

Think of it as a decentralized alternative to WeTransfer.

## Prerequisites

- Node.js >= 22
- pnpm
- A Shelby account with testnet tokens
- Shelby API key

## Installation

Navigate to the file-sharing directory and install dependencies:

    cd apps/file-sharing
    pnpm install

## Environment Variables

Copy the example file and fill in your credentials:

    cp .env.example .env

Required variables:

    SHELBY_ACCOUNT_PRIVATE_KEY=your_private_key_here
    SHELBY_API_KEY=your_api_key_here
    PORT=3000

## Usage

    pnpm dev

Open http://localhost:3000 in your browser.

## How It Works

1. Upload — User selects a file; the server pushes it to Shelby via client.upload()
2. Hash — A SHA-256 digest is computed locally before upload for integrity verification
3. Link — A unique drop ID is generated and stored in drops.json
4. Share — Anyone with the link can hit /drop/:id/download to stream the file from Shelby via client.download()
5. Verify — The SHA-256 hash is displayed on the download page so recipients can verify file integrity

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | /upload | Upload a file multipart/form-data |
| GET | /drop/:id | Get drop metadata |
| GET | /drop/:id/download | Download file from Shelby |
| GET | /drops | List all drops |

## Project Structure

    apps/file-sharing/
    src/
        server.ts      # Express server + Shelby SDK integration
    public/            # Static frontend
    .env.example
    package.json
    README.md
    tsconfig.json
