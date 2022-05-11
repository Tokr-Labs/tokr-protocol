//! Program state processor

use solana_program::{account_info::{AccountInfo, next_account_info}, entrypoint::ProgramResult, msg, pubkey::Pubkey};
use solana_program::program::{invoke, invoke_signed};

/// Processes DepositCapital instruction
pub fn process_deposit_capital(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let realm = next_account_info(account_info_iter)?; // 0
    let capital_governance = next_account_info(account_info_iter)?; // 1
    let lp_governance = next_account_info(account_info_iter)?; // 2
    let lp_governed_account = next_account_info(account_info_iter)?; // 3
    let capital_token_authority = next_account_info(account_info_iter)?; // 4
    let capital_token_account = next_account_info(account_info_iter)?; // 5
    let capital_token_holding_account = next_account_info(account_info_iter)?; // 6
    let capital_token_mint = next_account_info(account_info_iter)?; // 7
    let lp_token_account = next_account_info(account_info_iter)?; // 8
    let lp_token_holding_account = next_account_info(account_info_iter)?; // 9
    let lp_token_mint = next_account_info(account_info_iter)?; // 10
    let token_program = next_account_info(account_info_iter)?; // 11
    let associated_token_program = next_account_info(account_info_iter)?; // 12
    let system_program = next_account_info(account_info_iter)?; // 13

    msg!("program_id = {}", program_id.to_string());
    msg!("realm = {}", realm.key.to_string());
    msg!("capital_governance = {}", capital_governance.key.to_string());
    msg!("lp_governance = {}", lp_governance.key.to_string());
    msg!("lp_governed_account = {}", lp_governed_account.key.to_string());
    msg!("capital_token_authority = {}", capital_token_authority.key.to_string());
    msg!("capital_token_account = {}", capital_token_account.key.to_string());
    msg!("capital_token_holding_account = {}", capital_token_holding_account.key.to_string());
    msg!("capital_token_mint = {}", capital_token_mint.key.to_string());
    msg!("lp_token_account = {}", lp_token_account.key.to_string());
    msg!("lp_token_holding_account = {}", lp_token_holding_account.key.to_string());
    msg!("lp_token_mint = {}", lp_token_mint.key.to_string());
    msg!("token_program = {}", token_program.key.to_string());
    msg!("associated_token_program = {}", associated_token_program.key.to_string());
    msg!("system_program = {}", system_program.key.to_string());

    // assert user's identity has been verified
    // assert that usdc being transferred in is of the correct mint
    // assert that user has the amount of usdc that they are trying to exchange for LP tokens
    // assert that the realm has the amount of lp tokens equalling the amount of usdc being transfered in

    // create account if it doesn't exist

    if lp_token_account.data_is_empty() {
        msg!("the lp token account for the user is empty. we need to create one.")
    }

    // transfer capital

    let capital_token_transfer_instruction = spl_token::instruction::transfer(
        token_program.key,
        capital_token_account.key,
        capital_token_holding_account.key,
        capital_token_authority.key,
        &[capital_token_authority.key],
        amount,
    )?;


    invoke(
        &capital_token_transfer_instruction,
        &[
            capital_token_account.clone(),
            capital_token_authority.clone(),
            token_program.clone(),
            capital_token_holding_account.clone()
        ],
    )?;

    // @TODO: Create transfer from governance lp token account into the users lp ata

    // transfer lp

    let lp_token_transfer_instruction = spl_token::instruction::transfer(
        token_program.key,
        lp_token_holding_account.key,
        lp_token_account.key,
        lp_governance.key,
        &[lp_governance.key],
        amount,
    )?;

    let (address, bump) = Pubkey::find_program_address(
        &[
            b"mint-governance",
            realm.key.as_ref(),
            lp_governed_account.key.as_ref(),
        ],
        program_id,
    );

    msg!("address = {}", address);
    msg!("bump = {}", bump);

    invoke_signed(
        &lp_token_transfer_instruction,
        &[
            lp_token_holding_account.clone(),
            lp_token_account.clone(),
            lp_governance.clone(),
        ],
        &[&[
            b"mint-governance",
            realm.key.as_ref(),
            lp_governed_account.key.as_ref(),
            &[bump]
        ]],
    )?;

    Ok(())
}
