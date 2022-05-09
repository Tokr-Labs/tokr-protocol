use anchor_lang::prelude::*;

use crate::state::metadata::*;

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
    /// Assigns the account as the signer of the transaction
    #[account(mut)]
    pub signer: Signer<'info>,

    /// Creates the account via a CPI to the system program and initializes it (sets its account discriminator).
    /// Marks the account as mutable and is mutually exclusive with mut.
    /// Makes the account rent exempt unless skipped with rent_exempt = skip.
    #[account(init, seeds = [group.as_ref(), signer.key.as_ref()], bump, payer = signer, space = Metadata::LEN)]
    pub record: Account<'info, Metadata>,

    pub system_program: Program<'info, System>,
    pub authority: SystemAccount<'info>,
}