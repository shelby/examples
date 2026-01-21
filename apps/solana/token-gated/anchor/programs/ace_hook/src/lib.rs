#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use access_control::{BlobMetadata, Receipt, ID as ACCESS_CONTROL_PROGRAM_ID};

// This is an ACE-specific access control program.
// Apps need to define such a callable so that consumers can prove they are allowed
// to access a given data by signing a transaction to call this callable and
// handing the signed transaction to decryption key providers.

declare_id!("8jDv41SQVKCaVtkbFS1ZaVDDCEtKkAc7QXV3Y1psGts9");

#[program]
pub mod ace_hook {
    use super::*;

    /// Assert that the caller has access to the specified blob.
    /// This function is called by consumers who sign a transaction proving their access.
    /// The signed transaction can then be presented to decryption key providers as proof of permission.
    pub fn assert_access(ctx: Context<AssertAccess>, full_blob_name_bytes: Vec<u8>) -> Result<()> {
        // Debug: log what we're checking
        msg!("blob_metadata.owner = {}", ctx.accounts.blob_metadata.owner);
        msg!("receipt.owner = {}", ctx.accounts.receipt.owner);
        msg!("expected = {}", ACCESS_CONTROL_PROGRAM_ID);
        
        // Verify blob_metadata account is owned by access_control program
        if *ctx.accounts.blob_metadata.owner != ACCESS_CONTROL_PROGRAM_ID {
            msg!("FAIL: blob_metadata owner");
            return Err(ErrorCode::InvalidAccountOwner.into());
        }
        
        // Verify receipt account is owned by access_control program
        if *ctx.accounts.receipt.owner != ACCESS_CONTROL_PROGRAM_ID {
            msg!("FAIL: receipt owner");
            return Err(ErrorCode::InvalidAccountOwner.into());
        }
        
        // Parse full_blob_name_bytes: [0:2] "0x" prefix, [2:34] owner_aptos_addr (32 bytes), [34] "/", [35:] blob_name
        if full_blob_name_bytes.len() < 35 
            || &full_blob_name_bytes[0..2] != b"0x" 
            || full_blob_name_bytes[34] != b'/' 
        {
            return Err(ErrorCode::InvalidBlobName.into());
        }
        let owner_aptos_addr: [u8; 32] = full_blob_name_bytes[2..34]
            .try_into()
            .map_err(|_| ErrorCode::InvalidBlobName)?;
        let blob_name = &full_blob_name_bytes[35..];
        
        // Derive expected PDA for blob_metadata (using access_control program's ID)
        let (expected_blob_metadata_pda, _bump) = Pubkey::find_program_address(
            &[
                b"blob_metadata",
                owner_aptos_addr.as_ref(),
                blob_name,
            ],
            &ACCESS_CONTROL_PROGRAM_ID,
        );
        if ctx.accounts.blob_metadata.key() != expected_blob_metadata_pda {
            return Err(ErrorCode::InvalidAccountOwner.into());
        }
        
        // Derive expected PDA for receipt (using access_control program's ID)
        let (expected_receipt_pda, _bump) = Pubkey::find_program_address(
            &[
                b"access",
                owner_aptos_addr.as_ref(),
                blob_name,
                ctx.accounts.user.key().as_ref(),
            ],
            &ACCESS_CONTROL_PROGRAM_ID,
        );
        if ctx.accounts.receipt.key() != expected_receipt_pda {
            return Err(ErrorCode::InvalidAccountOwner.into());
        }
        
        // Deserialize accounts owned by access_control program
        let blob_metadata_data = &ctx.accounts.blob_metadata.try_borrow_data()?;
        let mut blob_metadata_slice = &blob_metadata_data[8..]; // Skip 8-byte discriminator
        let blob_metadata = BlobMetadata::deserialize(&mut blob_metadata_slice)?;
        
        let receipt_data = &ctx.accounts.receipt.try_borrow_data()?;
        let mut receipt_slice = &receipt_data[8..]; // Skip 8-byte discriminator
        let receipt = Receipt::deserialize(&mut receipt_slice)?;

        require!(
            blob_metadata.seqnum == receipt.seqnum,
            ErrorCode::AccessDenied
        );

        Ok(())
    }
}

#[derive(Accounts)]
pub struct AssertAccess<'info> {
    /// CHECK: Account owned by access_control program, we verify ownership and deserialize manually
    pub blob_metadata: AccountInfo<'info>,
    
    /// CHECK: Account owned by access_control program, we verify ownership and deserialize manually
    pub receipt: AccountInfo<'info>,
    
    pub user: Signer<'info>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Access denied")]
    AccessDenied,
    #[msg("Invalid blob name format")]
    InvalidBlobName,
    #[msg("Invalid account owner")]
    InvalidAccountOwner,
}

