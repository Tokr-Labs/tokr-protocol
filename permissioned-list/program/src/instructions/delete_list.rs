use anchor_lang::prelude::*;

use crate::state::ListMetadata;
use crate::errors::ErrorCode;

pub fn delete_list(
    ctx: Context<DeleteList>
) -> Result<()> {
    let list = &mut ctx.accounts.list;
    let signer = &mut ctx.accounts.signer;

    require!(list.authority == signer.key.clone(), ErrorCode::NotAuthorized);
    Ok(())
}

#[derive(Accounts)]
pub struct DeleteList<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut, close = signer, seeds = [b"list", signer.key.as_ref()], bump)]
    pub list: Account<'info, ListMetadata>,
}
