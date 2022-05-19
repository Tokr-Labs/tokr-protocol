use anchor_lang::prelude::*;

use crate::state::identity_record::*;
use crate::errors::IdentityVerificationErrorCode;

/// Create a record of kyc/aml metadata for the user.
pub fn delete_record(
    ctx: Context<DeleteRecord>,
    bump: u8,
    _group: Pubkey,
) -> Result<()> {

    let signer = &mut ctx.accounts.signer;

    require!(ctx.accounts.record.authority.key() == signer.key.clone(), IdentityVerificationErrorCode::NotAuthorized);

    Ok(())
}

#[derive(Accounts)]
#[instruction(bump: u8, group: Pubkey)]
pub struct DeleteRecord<'info> {

    #[account(mut)]
    pub signer: Signer<'info>,

    /// Creates the account via a CPI to the system program and initializes it (sets its account discriminator).
    /// Marks the account as mutable and is mutually exclusive with mut.
    /// Makes the account rent exempt unless skipped with rent_exempt = skip.
    #[account(mut, close = subject, seeds = [b"identity", group.as_ref(), subject.key.as_ref()], bump)]
    pub record: Account<'info, IdentityRecord>,

    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub subject: SystemAccount<'info>,
}