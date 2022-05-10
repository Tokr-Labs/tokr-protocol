//! Program state processor

use solana_program::{
    account_info::{AccountInfo, next_account_info},
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
};
use solana_program::program::invoke;
use spl_governance_tools::account::create_and_serialize_account_signed;

use crate::{
    error::GovernanceError,
    state::{
        enums::GovernanceAccountType,
        realm::get_realm_data,
        token_owner_record::{
            get_token_owner_record_address_seeds, get_token_owner_record_data_for_seeds,
            TokenOwnerRecordV2,
        },
    },
    tools::spl_token::{get_spl_token_mint, get_spl_token_owner, transfer_spl_tokens},
};
use crate::state::realm::get_realm_address_seeds;
use crate::tools::spl_token::transfer_spl_tokens_signed;

/// Processes DepositCapital instruction
pub fn process_deposit_capital(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {

    let account_info_iter = &mut accounts.iter();

    let realm_info = next_account_info(account_info_iter)?; // 0
    let usdc_token_holding_account = next_account_info(account_info_iter)?; // 0
    let usdc_token_source = next_account_info(account_info_iter)?; // 0
    let usdc_token_owner = next_account_info(account_info_iter)?; // 0

    /*
    ///  0.  `[]` Governance Realm account
    ///  1.  `[writable]` USDC Holding account. PDA seeds: [governance, usdc_token_mint]
    ///  2.  `[writable]` USDC Source account. USDC tokens from the account will be transferred to the Holding account
    ///  3.  `[signer]` USDC Source Token Owner account
    ///  4.  `[signer]` USDC Token Transfer Authority
    ///  5.  `[signer]` LP Token Transfer authority
    ///  6.  `[writable]` LP Token Destination account. LP token account for USDC source account holder.
    ///  7.  `[signer]` Payer
    ///  8.  `[]` System
    ///  9.  `[]` SPL Token
    ///  10. `[]` Sysvar Rent
     */

    /*
    let governing_token_holding_info = next_account_info(account_info_iter)?; // 1
    let governing_token_source_info = next_account_info(account_info_iter)?; // 2
    let governing_token_owner_info = next_account_info(account_info_iter)?; // 3
    let governing_token_transfer_authority_info = next_account_info(account_info_iter)?; // 4
    let token_owner_record_info = next_account_info(account_info_iter)?; // 5
    let payer_info = next_account_info(account_info_iter)?; // 6
    let system_info = next_account_info(account_info_iter)?; // 7
    let spl_token_info = next_account_info(account_info_iter)?; // 8
     */

    // assert user's identity has been verified
    // assert that usdc being transferred in is of the correct mint
    // assert that user has the amount of usdc that they are trying to exchange for LP tokens
    // assert that the realm has the amount of lp tokens equalling the amount of usdc being transfered in

    // create lp token ata if one does not exist
    // transfer usdc into realm
    // transfer lp tokens to user

    let transfer_instruction = spl_token::instruction::transfer(
        &spl_token::id(),
        source_info.key,
        destination_info.key,
        authority_info.key,
        &[],
        amount,
    ).unwrap();

    invoke(
        &transfer_instruction,
        &[
            spl_token_info.clone(),
            authority_info.clone(),
            source_info.clone(),
            destination_info.clone(),
        ]
    )?;

    // transfer_spl_tokens_signed(
    //     governing_token_holding_info,
    //     governing_token_destination_info,
    //     realm_info,
    //     &get_realm_address_seeds(&realm_data.name),
    //     program_id,
    //     token_owner_record_data.governing_token_deposit_amount,
    //     spl_token_info,
    // )?;
    //
    // transfer_spl_tokens_signed(
    //     governing_token_holding_info,
    //     governing_token_destination_info,
    //     realm_info,
    //     &get_realm_address_seeds(&realm_data.name),
    //     program_id,
    //     token_owner_record_data.governing_token_deposit_amount,
    //     spl_token_info,
    // )?;

    /*
    let realm_info = next_account_info(account_info_iter)?; // 0
    let governing_token_holding_info = next_account_info(account_info_iter)?; // 1
    let governing_token_source_info = next_account_info(account_info_iter)?; // 2
    let governing_token_owner_info = next_account_info(account_info_iter)?; // 3
    let governing_token_transfer_authority_info = next_account_info(account_info_iter)?; // 4
    let token_owner_record_info = next_account_info(account_info_iter)?; // 5
    let payer_info = next_account_info(account_info_iter)?; // 6
    let system_info = next_account_info(account_info_iter)?; // 7
    let spl_token_info = next_account_info(account_info_iter)?; // 8

    let rent = Rent::get()?;

    let realm_data = get_realm_data(program_id, realm_info)?;
    let governing_token_mint = get_spl_token_mint(governing_token_holding_info)?;

    realm_data.asset_governing_tokens_deposits_allowed(&governing_token_mint)?;

    realm_data.assert_is_valid_governing_token_mint_and_holding(
        program_id,
        realm_info.key,
        &governing_token_mint,
        governing_token_holding_info.key,
    )?;

    transfer_spl_tokens(
        governing_token_source_info,
        governing_token_holding_info,
        governing_token_transfer_authority_info,
        amount,
        spl_token_info,
    )?;

    let token_owner_record_address_seeds = get_token_owner_record_address_seeds(
        realm_info.key,
        &governing_token_mint,
        governing_token_owner_info.key,
    );

    if token_owner_record_info.data_is_empty() {

        // Deposited tokens can only be withdrawn by the owner so let's make sure the owner signed the transaction
        let governing_token_owner = get_spl_token_owner(governing_token_source_info)?;

        if !(governing_token_owner == *governing_token_owner_info.key
            && governing_token_owner_info.is_signer)
        {
            return Err(GovernanceError::GoverningTokenOwnerMustSign.into());
        }

        let token_owner_record_data = TokenOwnerRecordV2 {
            account_type: GovernanceAccountType::TokenOwnerRecordV2,
            realm: *realm_info.key,
            governing_token_owner: *governing_token_owner_info.key,
            governing_token_deposit_amount: amount,
            governing_token_mint,
            governance_delegate: None,
            unrelinquished_votes_count: 0,
            total_votes_count: 0,
            outstanding_proposal_count: 0,
            reserved: [0; 7],
            reserved_v2: [0; 128],
        };

        create_and_serialize_account_signed(
            payer_info,
            token_owner_record_info,
            &token_owner_record_data,
            &token_owner_record_address_seeds,
            program_id,
            system_info,
            &rent,
        )?;
    } else {
        let mut token_owner_record_data = get_token_owner_record_data_for_seeds(
            program_id,
            token_owner_record_info,
            &token_owner_record_address_seeds,
        )?;

        token_owner_record_data.governing_token_deposit_amount = token_owner_record_data
            .governing_token_deposit_amount
            .checked_add(amount)
            .unwrap();

        token_owner_record_data.serialize(&mut *token_owner_record_info.data.borrow_mut())?;
    }
    */

    Ok(())

}
