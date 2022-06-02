use anchor_lang::prelude::*;
use crate::errors::IdentityVerificationErrorCode;
use crate::state::identity_record::*;

/// Update all statuses to approved
pub fn approve(
    ctx: Context<UpdateRecord>,
    _bump: u8,
    _group: Pubkey
) -> Result<()> {
    let authority = &mut ctx.accounts.authority;

    require!(ctx.accounts.record.authority.key() == authority.key.clone(), IdentityVerificationErrorCode::NotAuthorized);

    ctx.accounts.record.aml_status = 2;
    ctx.accounts.record.kyc_status = 2;
    ctx.accounts.record.ia_status = 2;

    Ok(())
}

/// Update all statuses to denied
pub fn deny(
    ctx: Context<UpdateRecord>,
    _bump: u8,
    _group: Pubkey
) -> Result<()> {
    let authority = &mut ctx.accounts.authority;

    require!(ctx.accounts.record.authority.key() == authority.key.clone(), IdentityVerificationErrorCode::NotAuthorized);

    ctx.accounts.record.aml_status = 3;
    ctx.accounts.record.kyc_status = 3;
    ctx.accounts.record.ia_status = 3;

    Ok(())
}

/// Update aml status of account
pub fn update_aml_status(
    ctx: Context<UpdateRecord>,
    _bump: u8,
    _group: Pubkey,
    status: u8,
) -> Result<()> {
    let authority = &mut ctx.accounts.authority;

    require!(ctx.accounts.record.authority.key() == authority.key.clone(), IdentityVerificationErrorCode::NotAuthorized);
    require!(status <= 3, IdentityVerificationErrorCode::UnknownStatus);

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

    require!(ctx.accounts.record.authority.key() == authority.key.clone(), IdentityVerificationErrorCode::NotAuthorized);
    require!(status <= 3, IdentityVerificationErrorCode::UnknownStatus);

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

    require!(ctx.accounts.record.authority.key() == authority.key.clone(), IdentityVerificationErrorCode::NotAuthorized);
    require!(status <= 3, IdentityVerificationErrorCode::UnknownStatus);

    ctx.accounts.record.kyc_status = status;

    Ok(())
}

#[derive(Accounts)]
#[instruction(bump: u8, group: Pubkey)]
pub struct UpdateRecord<'info> {
    #[account(mut, seeds = [b"identity", group.as_ref(), subject.key.as_ref()], bump)]
    pub record: Account<'info, IdentityRecord>,
    pub subject: SystemAccount<'info>,
    pub authority: Signer<'info>,
}