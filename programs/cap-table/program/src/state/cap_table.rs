use anchor_lang::prelude::*;


#[derive(Default)]
#[account]
pub struct CapTable {
    /// entries for all accounts in the cap table
    pub entries: Vec<CapTableEntry>,
    /// total minted tokens, held by both users and the treasury stock account
    pub authorized_supply: u64,
    /// Amount held in the treasury stock account (could potentially be "issued" later)
    pub reserved_supply: u64,
}

#[derive(Default)]
#[account]
pub struct CapTableEntry {
    /// The holder of the spl token
    pub holder: Pubkey,
    /// The total tokens held
    pub tokens_held: u64,
    /// The percentage of the total number of tokens / tokens held
    pub percent_held: u64,
}