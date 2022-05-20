//! Identity account

use borsh::{BorshDeserialize, BorshSchema, BorshSerialize};
use solana_program::pubkey::Pubkey;

/// identity for use in governance program
#[derive(Clone, Debug, PartialEq, BorshDeserialize, BorshSerialize, BorshSchema)]
pub struct Identity {

    /// this is the anchor discriminator
    pub discriminator: [u8; 8],

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