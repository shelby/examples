use anchor_lang::prelude::*;
use crate::{BlobMetadata, Receipt};

#[derive(Accounts)]
#[instruction(storage_account_address: [u8; 32], blob_name: String)]
pub struct Purchase<'info> {
    #[account(
        seeds = [b"blob_metadata", storage_account_address.as_ref(), blob_name.as_bytes()],
        bump
    )]
    pub blob_metadata: Account<'info, BlobMetadata>,
    
    #[account(
        init,
        payer = buyer,
        space = 8 + 8, // discriminator + seqnum
        seeds = [b"access", storage_account_address.as_ref(), blob_name.as_bytes(), buyer.key().as_ref()],
        bump
    )]
    pub receipt: Account<'info, Receipt>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    /// CHECK: We verify this matches blob_metadata.owner
    #[account(mut)]
    pub owner: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Purchase>, _storage_account_address: [u8; 32], _blob_name: String) -> Result<()> {
    let blob_metadata = &ctx.accounts.blob_metadata;
    msg!("purchase: price={}", blob_metadata.price);
    msg!("purchase: seqnum={}", blob_metadata.seqnum);
    
    // Verify the owner account matches the blob's registered owner
    require!(
        ctx.accounts.owner.key() == blob_metadata.owner,
        PurchaseError::InvalidOwner
    );
    
    // Transfer SOL from buyer to owner
    anchor_lang::solana_program::program::invoke(
        &anchor_lang::solana_program::system_instruction::transfer(
            ctx.accounts.buyer.key,
            &ctx.accounts.owner.key(),
            blob_metadata.price,
        ),
        &[
            ctx.accounts.buyer.to_account_info(),
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Record the purchase
    let receipt = &mut ctx.accounts.receipt;
    receipt.seqnum = blob_metadata.seqnum;

    Ok(())
}

#[error_code]
pub enum PurchaseError {
    #[msg("Owner account does not match the blob's registered owner")]
    InvalidOwner,
}

