use anchor_lang::prelude::*;

use crate::state::identity_record::*;

/// Create a record of kyc/aml metadata for the user.
pub fn create_record(
    ctx: Context<CreateRecord>,
    bump: u8,
    _group: Pubkey,
) -> Result<()> {
    ctx.accounts.record.aml_status = 0;
    ctx.accounts.record.ia_status = 0;
    ctx.accounts.record.kyc_status = 0;
    ctx.accounts.record.bump = bump;
    ctx.accounts.record.authority = ctx.accounts.authority.key.clone();

    Ok(())
}

#[derive(Accounts)]
#[instruction(bump: u8, group: Pubkey)]
pub struct CreateRecord<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(init, seeds = [b"identity", group.as_ref(), signer.key.as_ref()], bump, payer = signer, space = IdentityRecord::LEN)]
    pub record: Account<'info, IdentityRecord>,
    pub system_program: Program<'info, System>,
    pub authority: SystemAccount<'info>,
}