//! Governance Account
use borsh::{BorshDeserialize, BorshSchema, BorshSerialize};
use borsh::maybestd::io::Write;
use solana_program::{
    account_info::AccountInfo, program_error::ProgramError,
    program_pack::IsInitialized, pubkey::Pubkey,
};

use spl_governance_tools::{
    account::{AccountMaxSize, assert_is_valid_account_of_types, get_account_data},
    error::GovernanceToolsError,
};

use crate::{
    error::GovernanceError,
    state::{
        enums::{GovernanceAccountType, VoteThresholdPercentage, VoteTipping},
        // legacy::{is_governance_v1_account_type, GovernanceV1},
        realm::assert_is_valid_realm,
    },
};

/// Governance config
#[repr(C)]
#[derive(Clone, Debug, PartialEq, BorshDeserialize, BorshSerialize, BorshSchema)]
pub struct GovernanceConfig {
    /// The type of the vote threshold used for voting
    /// Note: In the current version only YesVote threshold is supported
    pub vote_threshold_percentage: VoteThresholdPercentage,

    /// Minimum community weight a governance token owner must possess to be able to create a proposal
    pub min_community_weight_to_create_proposal: u64,

    /// Minimum waiting time in seconds for a transaction to be executed after proposal is voted on
    pub min_transaction_hold_up_time: u32,

    /// Time limit in seconds for proposal to be open for voting
    pub max_voting_time: u32,

    /// Conditions under which a vote will complete early
    pub vote_tipping: VoteTipping,

    /// The time period in seconds within which a Proposal can be still cancelled after being voted on
    /// Once cool off time expires Proposal can't be cancelled any longer and becomes a law
    /// Note: This field is not implemented in the current version
    pub proposal_cool_off_time: u32,

    /// Minimum council weight a governance token owner must possess to be able to create a proposal
    pub min_council_weight_to_create_proposal: u64,
}

/// Governance Account
#[repr(C)]
#[derive(Clone, Debug, PartialEq, BorshDeserialize, BorshSerialize, BorshSchema)]
pub struct Governance {
    /// Account type. It can be Uninitialized, Governance, ProgramGovernance, TokenGovernance or MintGovernance
    pub account_type: GovernanceAccountType,

    /// Governance Realm
    pub realm: Pubkey,

    /// Account governed by this Governance and/or PDA identity seed
    /// It can be Program account, Mint account, Token account or any other account
    ///
    /// Note: The account doesn't have to exist. In that case the field is only a PDA seed
    ///
    /// Note: Setting governed_account doesn't give any authority over the governed account
    /// The relevant authorities for specific account types must still be transferred to the Governance PDA
    /// Ex: mint_authority/freeze_authority for a Mint account
    /// or upgrade_authority for a Program account should be transferred to the Governance PDA
    pub governed_account: Pubkey,

    /// Running count of proposals
    pub proposals_count: u32,

    /// Governance config
    pub config: GovernanceConfig,

    /// Reserved space for future versions
    pub reserved: [u8; 6],

    /// The number of proposals in voting state in the Governance
    pub voting_proposal_count: u16,

    /// Reserved space for versions v2 and onwards
    /// Note: This space won't be available to v1 accounts until runtime supports resizing
    pub reserved_v2: [u8; 128],
}

impl AccountMaxSize for Governance {}

/// Checks if the given account type is one of the Governance V2 account types
pub fn is_governance_v2_account_type(account_type: &GovernanceAccountType) -> bool {
    match account_type {
        GovernanceAccountType::Governance |
        GovernanceAccountType::ProgramGovernance |
        GovernanceAccountType::MintGovernance |
        GovernanceAccountType::TokenGovernance => true,
        GovernanceAccountType::Uninitialized
        | GovernanceAccountType::Realm
        | GovernanceAccountType::RealmConfig
        | GovernanceAccountType::TokenOwnerRecord
        | GovernanceAccountType::Proposal
        | GovernanceAccountType::SignatoryRecord
        | GovernanceAccountType::ProposalTransaction
        | GovernanceAccountType::VoteRecord
        | GovernanceAccountType::ProgramMetadata => false,
    }
}

// Checks if the given account type is on of the Governance account types of any version
// pub fn is_governance_account_type(account_type: &GovernanceAccountType) -> bool {
//     is_governance_v1_account_type(account_type) || is_governance_v2_account_type(account_type)
// }

impl IsInitialized for Governance {
    fn is_initialized(&self) -> bool {
        is_governance_v2_account_type(&self.account_type)
    }
}

impl Governance {
    /// Returns Governance PDA seeds
    pub fn get_governance_address_seeds(&self) -> Result<[&[u8]; 3], ProgramError> {
        let seeds = match self.account_type {
            GovernanceAccountType::Governance => {
                get_governance_address_seeds(&self.realm, &self.governed_account)
            }
            GovernanceAccountType::ProgramGovernance => {
                get_program_governance_address_seeds(&self.realm, &self.governed_account)
            }
            GovernanceAccountType::MintGovernance => {
                get_mint_governance_address_seeds(&self.realm, &self.governed_account)
            }
            GovernanceAccountType::TokenGovernance => {
                get_token_governance_address_seeds(&self.realm, &self.governed_account)
            }
            GovernanceAccountType::Uninitialized
            | GovernanceAccountType::RealmConfig
            | GovernanceAccountType::VoteRecord
            | GovernanceAccountType::ProposalTransaction
            | GovernanceAccountType::Proposal
            | GovernanceAccountType::ProgramMetadata
            | GovernanceAccountType::Realm
            | GovernanceAccountType::TokenOwnerRecord
            | GovernanceAccountType::SignatoryRecord => {
                return Err(GovernanceToolsError::InvalidAccountType.into())
            }
        };

        Ok(seeds)
    }

    /// Serializes account into the target buffer
    pub fn serialize<W: Write>(self, writer: &mut W) -> Result<(), ProgramError> {
        BorshSerialize::serialize(&self, writer)?;
        Ok(())
    }
}

/// Deserializes Governance account and checks owner program
pub fn get_governance_data(
    program_id: &Pubkey,
    governance_info: &AccountInfo,
) -> Result<Governance, ProgramError> {

    if governance_info.data_is_empty() {
        return Err(GovernanceToolsError::AccountDoesNotExist.into());
    }

    get_account_data::<Governance>(program_id, governance_info)
}

/// Deserializes Governance account, checks owner program and asserts governance belongs to the given ream
pub fn get_governance_data_for_realm(
    program_id: &Pubkey,
    governance_info: &AccountInfo,
    realm: &Pubkey,
) -> Result<Governance, ProgramError> {
    let governance_data = get_governance_data(program_id, governance_info)?;

    if governance_data.realm != *realm {
        return Err(GovernanceError::InvalidRealmForGovernance.into());
    }

    Ok(governance_data)
}

/// Checks the given account is a governance account and belongs to the given realm
pub fn assert_governance_for_realm(
    program_id: &Pubkey,
    governance_info: &AccountInfo,
    realm: &Pubkey,
) -> Result<(), ProgramError> {
    get_governance_data_for_realm(program_id, governance_info, realm)?;
    Ok(())
}

/// Returns ProgramGovernance PDA seeds
pub fn get_program_governance_address_seeds<'a>(
    realm: &'a Pubkey,
    governed_program: &'a Pubkey,
) -> [&'a [u8]; 3] {
    // 'program-governance' prefix ensures uniqueness of the PDA
    // Note: Only the current program upgrade authority can create an account with this PDA using CreateProgramGovernance instruction
    [
        b"program-governance",
        realm.as_ref(),
        governed_program.as_ref(),
    ]
}

/// Returns ProgramGovernance PDA address
pub fn get_program_governance_address<'a>(
    program_id: &Pubkey,
    realm: &'a Pubkey,
    governed_program: &'a Pubkey,
) -> Pubkey {
    Pubkey::find_program_address(
        &get_program_governance_address_seeds(realm, governed_program),
        program_id,
    )
    .0
}

/// Returns MintGovernance PDA seeds
pub fn get_mint_governance_address_seeds<'a>(
    realm: &'a Pubkey,
    governed_mint: &'a Pubkey,
) -> [&'a [u8]; 3] {
    // 'mint-governance' prefix ensures uniqueness of the PDA
    // Note: Only the current mint authority can create an account with this PDA using CreateMintGovernance instruction
    [b"mint-governance", realm.as_ref(), governed_mint.as_ref()]
}

/// Returns MintGovernance PDA address
pub fn get_mint_governance_address<'a>(
    program_id: &Pubkey,
    realm: &'a Pubkey,
    governed_mint: &'a Pubkey,
) -> Pubkey {
    Pubkey::find_program_address(
        &get_mint_governance_address_seeds(realm, governed_mint),
        program_id,
    )
    .0
}

/// Returns TokenGovernance PDA seeds
pub fn get_token_governance_address_seeds<'a>(
    realm: &'a Pubkey,
    governed_token: &'a Pubkey,
) -> [&'a [u8]; 3] {
    // 'token-governance' prefix ensures uniqueness of the PDA
    // Note: Only the current token account owner can create an account with this PDA using CreateTokenGovernance instruction
    [b"token-governance", realm.as_ref(), governed_token.as_ref()]
}

/// Returns TokenGovernance PDA address
pub fn get_token_governance_address<'a>(
    program_id: &Pubkey,
    realm: &'a Pubkey,
    governed_token: &'a Pubkey,
) -> Pubkey {
    Pubkey::find_program_address(
        &get_token_governance_address_seeds(realm, governed_token),
        program_id,
    )
    .0
}

/// Returns Governance PDA seeds
pub fn get_governance_address_seeds<'a>(
    realm: &'a Pubkey,
    governed_account: &'a Pubkey,
) -> [&'a [u8]; 3] {
    [
        b"account-governance",
        realm.as_ref(),
        governed_account.as_ref(),
    ]
}

/// Returns Governance PDA address
pub fn get_governance_address<'a>(
    program_id: &Pubkey,
    realm: &'a Pubkey,
    governed_account: &'a Pubkey,
) -> Pubkey {
    Pubkey::find_program_address(
        &get_governance_address_seeds(realm, governed_account),
        program_id,
    )
    .0
}

/// Checks whether the Governance account exists, is initialized and owned by the Governance program
pub fn assert_is_valid_governance(
    program_id: &Pubkey,
    governance_info: &AccountInfo,
) -> Result<(), ProgramError> {
    assert_is_valid_account_of_types(program_id, governance_info, is_governance_v2_account_type)
}

/// Validates args supplied to create governance account
pub fn assert_valid_create_governance_args(
    program_id: &Pubkey,
    governance_config: &GovernanceConfig,
    realm_info: &AccountInfo,
) -> Result<(), ProgramError> {
    assert_is_valid_realm(program_id, realm_info)?;

    assert_is_valid_governance_config(governance_config)?;

    Ok(())
}

/// Validates governance config parameters
pub fn assert_is_valid_governance_config(
    governance_config: &GovernanceConfig,
) -> Result<(), ProgramError> {
    match governance_config.vote_threshold_percentage {
        VoteThresholdPercentage::YesVote(yes_vote_threshold_percentage) => {
            if !(1..=100).contains(&yes_vote_threshold_percentage) {
                return Err(GovernanceError::InvalidVoteThresholdPercentage.into());
            }
        }
        _ => {
            return Err(GovernanceError::VoteThresholdPercentageTypeNotSupported.into());
        }
    }

    if governance_config.proposal_cool_off_time > 0 {
        return Err(GovernanceError::ProposalCoolOffTimeNotSupported.into());
    }

    Ok(())
}
