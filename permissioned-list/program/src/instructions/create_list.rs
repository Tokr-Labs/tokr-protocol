use anchor_lang::prelude::*;
use crate::state::ListMetadata;

pub fn create_list(
    ctx: Context<CreateList>
) -> Result<()> {
    let list = &mut ctx.accounts.list;
    let signer = &mut ctx.accounts.signer;

    list.authority = signer.key.clone();

    Ok(())
}

#[derive(Accounts)]
pub struct CreateList<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(init, seeds = [b"list", signer.key.as_ref()], bump, payer = signer, space = 8 + 32)]
    pub list: Account<'info, ListMetadata>,
    pub system_program: Program<'info, System>,
}