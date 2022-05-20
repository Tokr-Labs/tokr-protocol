//! Program state processor

use solana_program::{account_info::{
    AccountInfo,
    next_account_info,
}, entrypoint::ProgramResult, program::{invoke, invoke_signed}, pubkey::Pubkey};
use crate::tools::verification::{assert_identity_verification};

/// Processes DepositCapital instruction
pub fn process_deposit_capital(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let realm = next_account_info(account_info_iter)?; // 0
    let lp_governance = next_account_info(account_info_iter)?; // 1
    let capital_token_authority = next_account_info(account_info_iter)?; // 2
    let capital_token_account = next_account_info(account_info_iter)?; // 3
    let capital_token_holding_account = next_account_info(account_info_iter)?; // 4
    let lp_token_account = next_account_info(account_info_iter)?; // 5
    let lp_token_holding_account = next_account_info(account_info_iter)?; // 6
    let lp_token_mint = next_account_info(account_info_iter)?; // 7
    let delegate_token_mint = next_account_info(account_info_iter)?; // 8
    let identity_verification_record = next_account_info(account_info_iter)?; // 9
    let identity_verification_program = next_account_info(account_info_iter)?; // 10
    let token_program = next_account_info(account_info_iter)?; // 11
    let system_program = next_account_info(account_info_iter)?; // 12
    let rent_program = next_account_info(account_info_iter)?; // 13

    // assert user's identity has been verified

    assert_identity_verification(
        identity_verification_record,
        capital_token_authority,
        realm,
        identity_verification_program
    )?;

    // create account if it doesn't exist

    if lp_token_account.data_is_empty() {
        #[allow(deprecated)]
            let create_account_instruction = &spl_associated_token_account::create_associated_token_account(
            capital_token_authority.key,
            capital_token_authority.key,
            lp_token_mint.key,
        );

        let account_infos = &[
            capital_token_authority.clone(),
            lp_token_account.clone(),
            capital_token_authority.clone(),
            lp_token_mint.clone(),
            system_program.clone(),
            token_program.clone(),
            rent_program.clone()
        ];

        invoke(
            &create_account_instruction,
            account_infos,
        )?;
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

    // transfer lp

    let lp_token_transfer_instruction = spl_token::instruction::transfer(
        token_program.key,
        lp_token_holding_account.key,
        lp_token_account.key,
        lp_governance.key,
        &[lp_governance.key],
        amount,
    )?;

    let (_address, bump) = Pubkey::find_program_address(
        &[
            b"mint-governance",
            realm.key.as_ref(),
            delegate_token_mint.key.as_ref(),
        ],
        program_id,
    );

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
            delegate_token_mint.key.as_ref(),
            &[bump]
        ]],
    )?;

    Ok(())
}
