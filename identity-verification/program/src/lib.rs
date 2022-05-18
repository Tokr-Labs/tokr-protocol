use anchor_lang::prelude::*;

use instructions::*;

pub mod errors;
pub mod instructions;
pub mod state;

// declare_id!("idv2F375xYuz2K7a7LxcrkhgWbPsJgpuWD3XLW1AFdD"); // mainnet
// declare_id!("5WJNeGKQQJMaTCPgtXhmsiEK4bA6dLT94smLFmTU8Gh9"); // devnet
declare_id!("3YC2irJKAzmuqeg2Qf9v8YBb1ufGmYTuvggxqv4bCyST"); // localnet

#[program]
mod identity_verification {
    use crate::state::Metadata;
    use super::*;

    /// Create a record of kyc/aml metadata for the user.
    pub fn create_record(
        ctx: Context<CreateRecord>,
        bump: u8,
        group: Pubkey,
    ) -> Result<()> {
        instructions::create_record::create_record(ctx, bump, group)
    }

    /// determine whether a particular user is verified or not
    /// **NOTE** According to [documentation](https://project-serum.github.io/anchor/tutorials/tutorial-3.html#return-values)
    /// solana currently has no way of parsing a result from a cpi call, so until then this method is just for placement
    pub fn get_is_verified(
        ctx: Context<IsVerified>,
        bump: u8,
        group: Pubkey,
    ) -> Result<bool> {
        instructions::get_is_verified::get_is_verified(ctx, bump, group)
    }

    /// Update accreditation status of account
    pub fn update_ia_status(
        ctx: Context<UpdateRecord>,
        bump: u8,
        group: Pubkey,
        status: u8,
    ) -> Result<()> {
        instructions::update_record::update_ia_status(ctx, bump, group, status)
    }

    /// Update aml status of account
    pub fn update_aml_status(
        ctx: Context<UpdateRecord>,
        bump: u8,
        group: Pubkey,
        status: u8,
    ) -> Result<()> {
        instructions::update_record::update_aml_status(ctx, bump, group, status)
    }

    /// Update kyc status of account
    pub fn update_kyc_status(
        ctx: Context<UpdateRecord>,
        bump: u8,
        group: Pubkey,
        status: u8,
    ) -> Result<()> {
        instructions::update_record::update_kyc_status(ctx, bump, group, status)
    }

    /// transfer the authority of a record to another account
    pub fn transfer_authority(
        ctx: Context<TransferAuthority>,
        bump: u8,
        group: Pubkey,
    ) -> Result<()> {
        instructions::transfer_authority::transfer_authority(ctx, bump, group)
    }
}