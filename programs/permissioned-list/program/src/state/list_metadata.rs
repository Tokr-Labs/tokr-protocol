use anchor_lang::prelude::*;

#[derive(Default)]
#[account]
pub struct ListMetadata {
    pub authority: Pubkey,
}
