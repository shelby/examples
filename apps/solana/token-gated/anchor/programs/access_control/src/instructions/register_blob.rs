use anchor_lang::prelude::*;
use crate::BlobMetadata;

#[derive(Accounts)]
#[instruction(storage_account_address: [u8; 32], blob_name: String)]
pub struct RegisterBlob<'info> {
    #[account(
        init,
        payer = owner,
        // discriminator + owner + scheme + greenBox + seqnum + price
        // NOTE: Solana CPI limits account creation to 10KB (10240 bytes)
        // greenBox is typically ~300 bytes, allocate 1KB to be safe
        space = 8  // discriminator
              + 32 // owner
              + 1  // scheme
              + 4 + 1024 // green_box_bytes vec len + data (1KB)
              + 8  // seqnum
              + 8, // price
        seeds = [b"blob_metadata", storage_account_address.as_ref(), blob_name.as_bytes()],
        bump
    )]
    pub blob_metadata: Account<'info, BlobMetadata>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterBlob>,
    _storage_account_address: [u8; 32],
    _blob_name: String,
    green_box_scheme: u8,
    green_box_bytes: Vec<u8>,
    price: u64,
) -> Result<()> {
    let blob_metadata = &mut ctx.accounts.blob_metadata;
    blob_metadata.owner = ctx.accounts.owner.key();
    blob_metadata.green_box_scheme = green_box_scheme;
    blob_metadata.green_box_bytes = green_box_bytes;
    blob_metadata.price = price;
    blob_metadata.seqnum += 1;
    Ok(())
}

