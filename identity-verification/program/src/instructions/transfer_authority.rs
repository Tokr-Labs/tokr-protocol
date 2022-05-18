use anchor_lang::prelude::*;

use crate::errors::ErrorCode;
use crate::state::metadata::*;

pub fn transfer_authority(
    ctx: Context<TransferAuthority>,
    _bump: u8,
    _group: Pubkey,
) -> Result<()> {
    let transfer_from = &mut ctx.accounts.transfer_from;
    let transfer_to = &mut ctx.accounts.transfer_to;

    require!(ctx.accounts.record.authority.key() == transfer_from.key.clone(), ErrorCode::NotAuthorized);

    ctx.accounts.record.authority = transfer_to.key.clone();

    Ok(())
}

#[derive(Accounts)]
#[instruction(bump: u8, group: Pubkey)]
pub struct TransferAuthority<'info> {
    #[account(mut, seeds = [b"identity", group.as_ref(), subject.key.as_ref()], bump)]
    pub record: Account<'info, Metadata>,
    pub subject: SystemAccount<'info>,
    pub transfer_to: SystemAccount<'info>,
    pub transfer_from: Signer<'info>,

}