#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

declare_id!("6XyAbrfHK5sinJAj3nXEVG2ALzKTXQv89JLuYwXictGV");

pub mod instructions;
pub use instructions::*;

/// Metadata for an encrypted blob registered on-chain.
/// Stores the encrypted key (greenBox) and price for access.
#[account]
pub struct BlobMetadata {
    /// The Solana owner who registered this blob
    pub owner: Pubkey,
    /// Encryption scheme used for the greenBox (2 = threshold IBE)
    pub green_box_scheme: u8,
    /// The encrypted cipher key (greenBox) that can be decrypted via ACE
    pub green_box_bytes: Vec<u8>,
    /// Sequence number for tracking updates
    pub seqnum: u64,
    /// Price in lamports to purchase access
    pub price: u64,
}

/// Receipt proving a buyer has purchased access to a blob.
#[account]
pub struct Receipt {
    /// Sequence number at time of purchase (must match blob's seqnum)
    pub seqnum: u64,
}

#[program]
pub mod access_control {
    use super::*;

    /// Register a new encrypted blob with its greenBox and price.
    /// Called by the file owner after uploading encrypted content to Shelby.
    pub fn register_blob(
        ctx: Context<RegisterBlob>,
        storage_account_address: [u8; 32],
        blob_name: String,
        green_box_scheme: u8,
        green_box_bytes: Vec<u8>,
        price: u64,
    ) -> Result<()> {
        msg!("register_blob: blob_name={}", blob_name);
        msg!("register_blob: green_box_scheme={}", green_box_scheme);
        msg!("register_blob: green_box_bytes_len={}", green_box_bytes.len());
        msg!("register_blob: price={}", price);
        instructions::register_blob::handler(
            ctx,
            storage_account_address,
            blob_name,
            green_box_scheme,
            green_box_bytes,
            price,
        )
    }

    /// Purchase access to a blob by paying the owner.
    /// Creates a receipt PDA that proves the buyer has paid.
    pub fn purchase(ctx: Context<Purchase>, storage_account_address: [u8; 32], blob_name: String) -> Result<()> {
        instructions::purchase::handler(ctx, storage_account_address, blob_name)
    }
}

