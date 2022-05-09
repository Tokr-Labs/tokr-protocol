use anchor_lang::prelude::*;

#[derive(Default)]
#[account]
pub struct Metadata {
    /// bump seed used in deriving the pda for the status account
    pub bump: u8,

    /// Accreditation status of the user (0 == initial, 1 == started, 2 == approved, 3 == rejected).
    pub ia_status: u8,

    /// AML status of the user (0 == initial, 1 == started, 2 == approved, 3 == rejected).
    pub aml_status: u8,

    /// KYC status of the user (0 == initial, 1 == started, 2 == approved, 3 == rejected).
    pub kyc_status: u8,

    /// Account who has update authority over the account
    pub authority: Pubkey,
}

impl Metadata {
    pub const LEN: usize = 8 + (1 * 3) + 1 + 32;
}
