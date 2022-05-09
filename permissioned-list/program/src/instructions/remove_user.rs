use anchor_lang::prelude::*;
use crate::state::{EntryMetadata, ListMetadata};
use crate::errors::ErrorCode;

pub fn remove_user(
    ctx: Context<RemoveUser>
) -> Result<()> {
    let list = &mut ctx.accounts.list;
    let signer = &mut ctx.accounts.signer;

    require!(list.authority == signer.key.clone(), ErrorCode::NotAuthorized);

    Ok(())
}

#[derive(Accounts)]
pub struct RemoveUser<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut, seeds = [b"list", signer.key.as_ref()], bump)]
    pub list: Account<'info, ListMetadata>,
    #[account(mut, close = signer, seeds = [list.key().as_ref(), user.key.as_ref()], bump)]
    pub entry: Account<'info, EntryMetadata>,
    #[account(mut)]
    pub user: SystemAccount<'info>,
}
