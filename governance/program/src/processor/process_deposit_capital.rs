//! Program state processor

use solana_program::{account_info::{AccountInfo, next_account_info}, entrypoint::ProgramResult, msg, pubkey::Pubkey};
use solana_program::program::{invoke, invoke_signed};
use crate::state::realm::get_capital_token_holding_address;

/// Processes DepositCapital instruction
pub fn process_deposit_capital(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {

    let account_info_iter = &mut accounts.iter();

    // @TODO: Add users ATA account to the accounts array

    let realm = next_account_info(account_info_iter)?; // 0
    let governance = next_account_info(account_info_iter)?; // 1
    let authority = next_account_info(account_info_iter)?; // 2
    let token_account = next_account_info(account_info_iter)?; // 3
    let vault = next_account_info(account_info_iter)?; // 4
    let token_mint = next_account_info(account_info_iter)?; // 5
    let token_program = next_account_info(account_info_iter)?; // 6
    let associated_token_program = next_account_info(account_info_iter)?; // 7
    let system_program = next_account_info(account_info_iter)?; // 8

    // let vault = get_capital_token_holding_address(
    //     token_program.key,
    //     associated_token_program.key,
    //     governance.key,
    //     token_mint.key
    // );

    // let vault_account_info = AccountInfo::from(vault);

    msg!("program_id = {}", program_id.to_string());
    msg!("realm = {}", realm.key.to_string());
    msg!("governance = {}", governance.key.to_string());
    msg!("authority = {}", authority.key.to_string());
    msg!("token_account = {}", token_account.key.to_string());
    msg!("token_mint = {}", token_mint.key.to_string());
    msg!("vault = {}", vault.key.to_string());
    msg!("token_program = {}", token_program.key.to_string());
    msg!("associated_token_program = {}", associated_token_program.key.to_string());
    msg!("system_program = {}", system_program.key.to_string());

    // assert user's identity has been verified
    // assert that usdc being transferred in is of the correct mint
    // assert that user has the amount of usdc that they are trying to exchange for LP tokens
    // assert that the realm has the amount of lp tokens equalling the amount of usdc being transfered in

    // transfer usdc into realm

    let ix = spl_token::instruction::transfer(
        token_program.key,
        token_account.key,
        vault.key,
        authority.key,
        &[authority.key],
        amount,
    )?;

    invoke(
        &ix,
        &[
            token_account.clone(),
            authority.clone(),
            token_program.clone(),
            vault.clone()
        ],
    )?;

    // @TODO: Create transfer from governance token account into the users ata



    Ok(())
}
