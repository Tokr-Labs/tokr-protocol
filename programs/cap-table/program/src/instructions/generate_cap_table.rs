use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::state::cap_table::CapTable;

pub fn generate_cap_table(
    ctx: Context<GenerateCapTable>
) -> Result<CapTable> {

    let mint = &mut ctx.accounts.mint;

    let cap_table = CapTable {
        entries: vec![],
        authorized_supply: 0,
        reserved_supply: 0
    };

    Ok(cap_table)

}

#[derive(Accounts)]
pub struct GenerateCapTable<'info> {
    pub mint: Account<'info, Mint>,
}
