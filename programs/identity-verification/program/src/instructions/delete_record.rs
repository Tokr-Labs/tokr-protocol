use anchor_lang::prelude::*;

use crate::state::identity_record::*;
use crate::errors::IdentityVerificationErrorCode;

/// Delete a record and return funds to the subject of the record
pub fn delete_record(
    ctx: Context<DeleteRecord>,
    _bump: u8,
    _group: Pubkey,
) -> Result<()> {

    let signer = &mut ctx.accounts.signer;

    require!(ctx.accounts.record.authority.key() == signer.key.clone(), IdentityVerificationErrorCode::NotAuthorized);

    Ok(())
}

#[derive(Accounts)]
#[instruction(bump: u8, group: Pubkey)]
pub struct DeleteRecord<'info> {
    #[account(mut, close = subject, seeds = [b"identity", group.as_ref(), subject.key.as_ref()], bump)]
    pub record: Account<'info, IdentityRecord>,
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub subject: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}