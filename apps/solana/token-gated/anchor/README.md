# Anchor Programs

This workspace contains two Solana programs:

## Programs

### 1. `access_control` (Token-Gated Access)

Manages token-gated file access and payments:

- **`register_blob`** - Sellers register encrypted files with a price and encrypted key (greenBox)
- **`purchase`** - Buyers pay SOL to get a receipt proving access
- Stores pricing + metadata needed to verify access later

PDAs:

- `blob_metadata`: `[b"blob_metadata", owner_aptos_addr, blob_name]`
- `receipt`: `[b"access", owner_aptos_addr, blob_name, buyer_pubkey]`

### 2. `ace_hook` (Access Verification)

Verifies access for ACE decryption:

- **`assert_access`** - Called by buyers to prove access; the signed transaction is used as proof-of-permission for ACE decryption key release
- This program is intentionally minimal and used only for permission proofs

This program exists separately so ACE workers can verify the correct instruction was called.

## Usage

You can either use the already deployed programs on testnet or deploy your own.

## Use Testnet Programs

Both programs are deployed to testnet and can be accessed through the addresses:

- `access_control: noXndy5tEgNpCz8HDCJpth6RPVqTmmY4G3aesxAxHTx`
- `ace_hook: 84w5P5Uqjb5EWrVU2yV81nBA2r4NQi69NZvYnRxWLpnt`

## Deploy Your Own Programs

### Building Locally

```bash
# From the anchor/ directory
anchor build
```

### Testing

```bash
anchor test --skip-deploy
```

### Deploying

#### Localnet

```bash
# Start a local validator in another terminal
solana-test-validator

# Fund your local wallet
solana airdrop 10 --url localhost

# Generate new keypairs
solana-keygen new -o target/deploy/access_control-keypair.json
solana-keygen new -o target/deploy/ace_hook-keypair.json

# Update declare_id!() in each src/lib.rs and Anchor.toml [programs.localnet]
# (ensure Anchor.toml points to the new program IDs)

# Deploy all programs to localnet
anchor deploy --provider.cluster localnet
```

#### Testnet

```bash
# Fund your wallet
solana airdrop 2 --url testnet

# Generate new keypairs
solana-keygen new -o target/deploy/access_control-keypair.json
solana-keygen new -o target/deploy/ace_hook-keypair.json

# Update declare_id!() in each src/lib.rs and Anchor.toml [programs.testnet]
# (ensure Anchor.toml points to the new program IDs)

# Deploy all programs to testnet
anchor deploy --provider.cluster testnet
```
