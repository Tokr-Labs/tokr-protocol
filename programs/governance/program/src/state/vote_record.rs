//! Proposal Vote Record Account

use borsh::{BorshDeserialize, BorshSchema, BorshSerialize};
use borsh::maybestd::io::Write;
use solana_program::{program_pack::IsInitialized, pubkey::Pubkey};
use solana_program::account_info::AccountInfo;
use solana_program::program_error::ProgramError;

use spl_governance_tools::account::{AccountMaxSize, get_account_data};

use crate::error::GovernanceError;
use crate::PROGRAM_AUTHORITY_SEED;
use crate::state::enums::GovernanceAccountType;

/// Voter choice for a proposal option
/// In the current version only 1) Single choice and 2) Multiple choices proposals are supported
/// In the future versions we can add support for 1) Quadratic voting, 2) Ranked choice voting and 3) Weighted voting
#[derive(Clone, Debug, PartialEq, BorshDeserialize, BorshSerialize, BorshSchema)]
pub struct VoteChoice {
    /// The rank given to the choice by voter
    /// Note: The filed is not used in the current version
    pub rank: u8,

    /// The voter's weight percentage given by the voter to the choice
    pub weight_percentage: u8,
}

impl VoteChoice {
    /// Returns the choice weight given the voter's weight
    pub fn get_choice_weight(&self, voter_weight: u64) -> Result<u64, ProgramError> {
        Ok(match self.weight_percentage {
            100 => voter_weight,
            0 => 0,
            _ => return Err(GovernanceError::InvalidVoteChoiceWeightPercentage.into()),
        })
    }
}

/// User's vote
#[derive(Clone, Debug, PartialEq, BorshDeserialize, BorshSerialize, BorshSchema)]
pub enum Vote {
    /// Vote approving choices
    Approve(Vec<VoteChoice>),

    /// Vote rejecting proposal
    Deny,

    /// Declare indifference to proposal
    /// Note: Not supported in the current version
    Abstain,

    /// Veto proposal
    /// Note: Not supported in the current version
    Veto,
}

/// Proposal VoteRecord
#[derive(Clone, Debug, PartialEq, BorshDeserialize, BorshSerialize, BorshSchema)]
pub struct VoteRecord {
    /// Governance account type
    pub account_type: GovernanceAccountType,

    /// Proposal account
    pub proposal: Pubkey,

    /// The user who casted this vote
    /// This is the Governing Token Owner who deposited governing tokens into the Realm
    pub governing_token_owner: Pubkey,

    /// Indicates whether the vote was relinquished by voter
    pub is_relinquished: bool,

    /// The weight of the user casting the vote
    pub voter_weight: u64,

    /// Voter's vote
    pub vote: Vote,

    /// Reserved space for versions v2 and onwards
    /// Note: This space won't be available to v1 accounts until runtime supports resizing
    pub reserved_v2: [u8; 8],
}

impl AccountMaxSize for VoteRecord {}

impl IsInitialized for VoteRecord {
    fn is_initialized(&self) -> bool {
        self.account_type == GovernanceAccountType::VoteRecord
    }
}

impl VoteRecord {
    /// Checks the vote can be relinquished
    pub fn assert_can_relinquish_vote(&self) -> Result<(), ProgramError> {
        if self.is_relinquished {
            return Err(GovernanceError::VoteAlreadyRelinquished.into());
        }

        Ok(())
    }

    /// Serializes account into the target buffer
    pub fn serialize<W: Write>(self, writer: &mut W) -> Result<(), ProgramError> {
        BorshSerialize::serialize(&self, writer)?;
        Ok(())
    }
}

/// Deserializes VoteRecord account and checks owner program
pub fn get_vote_record_data(
    program_id: &Pubkey,
    vote_record_info: &AccountInfo,
) -> Result<VoteRecord, ProgramError> {
    get_account_data::<VoteRecord>(program_id, vote_record_info)
}

/// Deserializes VoteRecord and checks it belongs to the provided Proposal and Governing Token Owner
pub fn get_vote_record_data_for_proposal_and_token_owner(
    program_id: &Pubkey,
    vote_record_info: &AccountInfo,
    proposal: &Pubkey,
    governing_token_owner: &Pubkey,
) -> Result<VoteRecord, ProgramError> {
    let vote_record_data = get_vote_record_data(program_id, vote_record_info)?;

    if vote_record_data.proposal != *proposal {
        return Err(GovernanceError::InvalidProposalForVoterRecord.into());
    }

    if vote_record_data.governing_token_owner != *governing_token_owner {
        return Err(GovernanceError::InvalidGoverningTokenOwnerForVoteRecord.into());
    }

    Ok(vote_record_data)
}

/// Returns VoteRecord PDA seeds
pub fn get_vote_record_address_seeds<'a>(
    proposal: &'a Pubkey,
    token_owner_record: &'a Pubkey,
) -> [&'a [u8]; 3] {
    [
        PROGRAM_AUTHORITY_SEED,
        proposal.as_ref(),
        token_owner_record.as_ref(),
    ]
}

/// Returns VoteRecord PDA address
pub fn get_vote_record_address<'a>(
    program_id: &Pubkey,
    proposal: &'a Pubkey,
    token_owner_record: &'a Pubkey,
) -> Pubkey {
    Pubkey::find_program_address(
        &get_vote_record_address_seeds(proposal, token_owner_record),
        program_id,
    )
        .0
}