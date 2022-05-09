use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::state::metadata::*;

/// Update aml status of account
pub fn update_aml_status(
    ctx: Context<UpdateRecord>,
    _bump: u8,
    _group: Pubkey,
    status: u8,
) -> Result<()> {
    let authority = &mut ctx.accounts.authority;
    require!(ctx.accounts.record.authority.key() == authority.key.clone(), ErrorCode::NotAuthorized);

    require!(status <= 3, ErrorCode::UnknownStatus);
    ctx.accounts.record.aml_status = status;

    Ok(())
}

/// Update ia status
pub fn update_ia_status(
    ctx: Context<UpdateRecord>,
    _bump: u8,
    _group: Pubkey,
    status: u8,
) -> Result<()> {
    let authority = &mut ctx.accounts.authority;
    require!(ctx.accounts.record.authority.key() == authority.key.clone(), ErrorCode::NotAuthorized);

    require!(status <= 3, ErrorCode::UnknownStatus);
    ctx.accounts.record.ia_status = status;

    Ok(())
}

/// Update kyc status of account
pub fn update_kyc_status(
    ctx: Context<UpdateRecord>,
    _bump: u8,
    _group: Pubkey,
    status: u8,
) -> Result<()> {
    let authority = &mut ctx.accounts.authority;
    require!(ctx.accounts.record.authority.key() == authority.key.clone(), ErrorCode::NotAuthorized);

    require!(status <= 3, ErrorCode::UnknownStatus);
    ctx.accounts.record.kyc_status = status;

    Ok(())
}

#[derive(Accounts)]
#[instruction(bump: u8, group: Pubkey)]
pub struct UpdateRecord<'info> {
    /// Checks that given account is a PDA derived from the currently executing program, the seeds,
    /// and if provided, the bump. If not provided, anchor uses the canonical bump.
    #[account(mut, seeds = [group.as_ref(), subject.key.as_ref()], bump)]
    pub record: Account<'info, Metadata>,

    /// Type validating that the account is owned by the system program. This is the account of who
    /// the record is about and should have been created by the system account ensuring that it is
    /// an actual user account.
    pub subject: SystemAccount<'info>,

    pub authority: Signer<'info>,
}