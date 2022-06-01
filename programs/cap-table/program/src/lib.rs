use anchor_lang::prelude::*;

use instructions::*;

pub mod instructions;
pub mod state;
pub mod errors;

// declare_id!("capHECuaWKqRXjprrW2nQ6MEsVi73rpUBCBfCWuffyN"); // mainnet
// declare_id!("35dT31cxMxdXjURjEvRfj4c3vZPXXdvDX6zpeF4YRckn"); // devnet
declare_id!("6H6qFBGye34eGAGE926hXeVc7Di7konqMFrD3nBPxmmX"); // localnet

#[program]
mod cap_table {

    use crate::state::cap_table::CapTable;
    use super::*;

    /// Generates a cap table
    pub fn generate(
        ctx: Context<GenerateCapTable>
    ) -> Result<CapTable> {
        instructions::generate_cap_table::generate_cap_table(ctx)
    }

}


