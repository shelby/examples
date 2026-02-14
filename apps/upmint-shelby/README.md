# UpMint Shelby

Upload files to the Shelby network and mint them as NFTs on Aptos (ShelbyNet). Built with Shelby Protocol for decentralized storage and Petra wallet for authentication.

![UpMint Shelby](https://img.shields.io/badge/Shelby-NFT-blue) ![Aptos](https://img.shields.io/badge/Aptos-ShelbyNet-purple)

## Features

- **Upload to Shelby** – Select files and upload them to the Shelby decentralized network
- **Create Collections** – Define a collection name before minting NFTs
- **Mint NFTs** – Turn your uploaded images into on-chain NFTs (Aptos Token standard)
- **My NFTs** – View your minted NFTs grouped by collection, with Explorer links
- **Petra Wallet** – Connect via Petra and use ShelbyNet for all transactions

## Tech Stack

- **React + TypeScript + Vite**
- **Shelby Protocol** – Blob storage and coordination
- **Aptos** – NFT minting (ShelbyNet)
- **Petra Wallet** – Wallet adapter for Aptos

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Petra Wallet](https://petra.app/) browser extension
- Petra configured for **ShelbyNet**

### Installation

```bash
git clone https://github.com/10ur5en/UpMint-Shelby.git
cd UpMint-Shelby
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
npm run preview
```

## Usage

1. **Connect** – Click "Connect with Petra" and approve the connection to ShelbyNet
2. **Upload** – Select image files to upload to the Shelby network
3. **Create Collection** – Enter a collection name and click "Create Collection"
4. **Mint** – Click "Mint NFT" on each uploaded image
5. **View** – See your NFTs in "My NFTs", grouped by collection

## Notes

- Only image files can be minted as NFTs
- Collection must be created before minting
- If Petra shows empty collection details, view NFTs on [Aptos Explorer](https://explorer.aptoslabs.com/?network=shelbynet)
- Proxy is used in dev for CORS; production should use proper backend or Shelby/Aptos endpoints

## Links

- [Shelby](https://shelby.xyz/)
- [Shelby Docs](https://docs.shelby.xyz/)
- [Aptos Explorer (ShelbyNet)](https://explorer.aptoslabs.com/?network=shelbynet)

## License

MIT
