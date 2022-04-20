use anchor_lang::prelude::*;

declare_id!("JDS6WitBF654whkcWz5i5HX1ixska8Je4ahw7XYS7h5A");

const DISCRIMINATOR_LENGTH: usize = 8;
const STATUS_LENGTH: usize = 1;
const BUMP_LENGTH: usize = 1;

#[program]
mod whitelist {

    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        bump: u8,
    ) -> Result<()> {

        ctx.accounts.whitelist_account.status = 0;
        ctx.accounts.whitelist_account.bump = bump;

        Ok(())
    }

}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(init, seeds = [b"whitelist".as_ref(), signer.key.as_ref()], bump, payer = signer, space = Metadata::LEN)]
    pub whitelist_account: Account<'info, Metadata>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct Metadata {
    pub bump: u8,
    pub status: u8
    // pub authority: Pubkey
}

impl Metadata {

    const LEN: usize = DISCRIMINATOR_LENGTH +
        STATUS_LENGTH +
        BUMP_LENGTH;

}