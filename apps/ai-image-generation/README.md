# Shelby AI Image Generation - Decentralized AI Artifact Registry

This demo demonstrates how **Shelby can serve as the data and provenance layer for AI systems**. Every AI inference run produces verifiable, on-chain artifacts that are immutable, attributable, and accessible via Shelby's decentralized network.

Unlike traditional cloud storage solutions, this application showcases Shelby as a **"Web3 S3" specifically designed for AI workloads** - where AI-generated content lives permanently on-chain with cryptographic provenance, not trapped in centralized systems.

## 🧠 What Makes This AI-Focused

This isn't just file storage - it's an **AI artifact registry** that demonstrates:

### **AI Provenance & Authenticity**

- Every generated image is cryptographically tied to your Aptos wallet address
- Immutable storage ensures AI outputs can't be tampered with after creation
- Full traceability from prompt → model → output → storage

### **Decentralized AI Infrastructure**

- **Compute Layer**: OpenAI DALL-E 3 (external AI service)
- **Storage Layer**: Shelby protocol (decentralized, incentivized network)
- **Provenance Layer**: Aptos blockchain (immutable ownership records)

### **AI-Specific Metadata**

Each generated image includes structured metadata stored alongside:

```json
{
  "prompt": "A futuristic city at sunset",
  "engine": "openai",
  "model": "dall-e-3",
  "createdAt": 1698765432000,
  "creator": "0x1234...abcd",
  "image": {
    "url": "https://api.shelbynet.shelby.xyz/shelby/v1/blobs/0x745...123/images/...."
  },
  "blobName": "images/A futuristic city at sunset_82p.png"
}
```

## 🏗️ Architecture: Modular Compute-Storage Separation

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   AI Compute    │    │   Shelby Storage │    │  Aptos Blockchain   │
│   (DALL-E 3)    │───▶│   (Artifacts)    │───▶│   (Provenance)      │
│                 │    │                  │    │                     │
│ • Image Gen     │    │ • Immutable      │    │ • Ownership         │
│ • Model Runs    │    │ • Decentralized  │    │ • Commitments       │
│ • Stateless     │    │ • Auditable      │    │ • Expiration        │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

This architecture proves that **AI models can run anywhere, but their data, artifacts, and provenance should live in a decentralized, verifiable layer**.

## 🔥 Why This Matters for AI

### **Verifiable AI Outputs**

- Prove ownership of AI-generated content
- Combat deepfakes with cryptographic authenticity
- Enable model output traceability and reproducibility

### **Open AI Infrastructure**

- AI artifacts aren't locked in vendor silos (AWS, Google Cloud)
- Decentralized storage with incentivized uptime guarantees
- Permissionless access to AI-generated data

### **Future-Ready for Verifiable Compute**

- Today: External AI + Shelby storage
- Tomorrow: Shelby-native AI compute in TEEs with zero-knowledge proofs
- Same artifact storage pattern scales to fully decentralized AI pipelines

## Getting Started

### Prerequisites

- `node` and `pnpm`
- Shelby and Aptos API keys. For best performance, you are encouraged to generate an API key so your app will not hit the rate limit.
  - Head to [Geomi](https://geomi.dev/)
  - Generate an API key for `shelbynet` and add it to the `.env` file as `NEXT_PUBLIC_SHELBY_API_KEY=<my-api-key>`
  - Generate an API key for `devnet` and add it to the `.env` file as `NEXT_PUBLIC_APTOS_API_KEY=<my-api-key>`
- OpenAI API Key. Head to [OpenAI Platform](https://platform.openai.com/api-keys) to generate an API Key and add it to the `.env` file as `OPENAI_API_KEY=<my-api-key>`

Create an `.env` file by copying the `.env.example` file and fill out the required variables.

```bash
cp .env.example .env
```

Then install dependencies and run the dapp locally

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

## 🛠️ Technical Implementation

### **AI Generation Pipeline**

```typescript
// 1. Generate image via OpenAI API
const imageBuffer = await generateImage(prompt);

// 2. Create cryptographic commitments
const commitments = await generateCommitments(provider, imageBuffer);

// 3. Register blob on Aptos blockchain
const payload = ShelbyBlobClient.createRegisterBlobPayload({
  account: account.address,
  blobName: `images/${blobName}.png`,
  blobMerkleRoot: commitments.blob_merkle_root,
  // ... other metadata
});

// 4. Upload to Shelby's decentralized network
await shelbyClient.rpc.putBlob({
  account: account.address,
  blobName: imageName,
  blobData: new Uint8Array(imageBuffer),
});
```

### **Key Features**

- **Cross-chain wallet support** (Aptos native + Solana + EVM wallets via sponsored transactions)
- **Metadata co-location** (JSON metadata stored alongside each image)
- **Gallery view** (All your AI artifacts in one place)
- **Explorer integration** (Direct links to Shelby blob explorer)

### **What You'll Experience:**

1. **Connect Wallet** - Your Aptos address becomes your AI identity
2. **Generate Image** - AI creates content using your prompt
3. **Store on Shelby** - Image + metadata uploaded to decentralized storage
4. **Verify Provenance** - View your artifacts in Shelby Explorer with full ownership proof

## 🔮 What This Proves About Shelby

| **Capability**                 | **Demonstrated**                                       |
| ------------------------------ | ------------------------------------------------------ |
| **AI Artifact Storage**        | ✅ Images stored & served decentralized                |
| **Replaces S3/IPFS for AI**    | ✅ Fast reads, permanent storage, verifiable ownership |
| **Compute-Storage Separation** | ✅ Model runs anywhere, results live on Shelby         |
| **Provenance & Authenticity**  | ✅ Each blob cryptographically tied to creator         |
| **Future-Ready Architecture**  | ✅ Same pattern works for Shelby-native compute        |
