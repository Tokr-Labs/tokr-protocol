use anchor_lang::prelude::*;
use crate::state::{EntryMetadata, ListMetadata};
use crate::errors::ErrorCode;

pub fn add_user(
    ctx: Context<AddUser>
) -> Result<()> {
    let list = &mut ctx.accounts.list;
    let signer = &mut ctx.accounts.signer;

    require!(list.authority == signer.key.clone(), ErrorCode::NotAuthorized);

    Ok(())
}

#[derive(Accounts)]
pub struct AddUser<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut, seeds = [b"list", signer.key.as_ref()], bump)]
    pub list: Account<'info, ListMetadata>,
    #[account(init, seeds = [list.key().as_ref(), user.key.as_ref()], bump, payer = signer, space = 8)]
    pub entry: Account<'info, EntryMetadata>,
    #[account(mut)]
    pub user: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}
