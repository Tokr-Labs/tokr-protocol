//! Identity Verification utility functions

use solana_program::account_info::AccountInfo;
use solana_program::borsh::try_from_slice_unchecked;
use solana_program::msg;
use solana_program::program_error::ProgramError;
use solana_program::pubkey::Pubkey;
use crate::error::GovernanceError;
use crate::state::identity::Identity;

/// helper to assert user identity verification
pub fn assert_identity_verification(
    record: &AccountInfo,
    subject: &AccountInfo,
    group: &AccountInfo,
    program: &AccountInfo
) -> Result<bool, ProgramError> {


    let identity_verification_account_address = Pubkey::find_program_address(
        &[
            b"identity",
            group.key.as_ref(),
            subject.key.as_ref()
        ],
        program.key,
    ).0;

    msg!("subject = {}", subject.key);
    msg!("group = {}", group.key);
    msg!("program = {}", program.key);

    msg!("identity_verification_account_address = {}", identity_verification_account_address);

    let idv: Identity = try_from_slice_unchecked(&record.data.borrow())?;

    let is_verified = idv.aml_status == 2 && idv.kyc_status == 2 && idv.ia_status == 2;

    msg!("is_verified = {}", is_verified);
    msg!("aml_status = {}", idv.aml_status);
    msg!("kyc_status = {}", idv.kyc_status);
    msg!("ia_status = {}", idv.ia_status);

    if record.key.as_ref() != identity_verification_account_address.as_ref() || !is_verified {
        return Err(GovernanceError::UserIdentityNotKnown.into());
    }

    Ok(false)

}