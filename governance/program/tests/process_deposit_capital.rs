#![cfg(feature = "test-bpf")]

use solana_program::instruction::AccountMeta;
use solana_program_test::*;

mod program_test;

use program_test::*;
use solana_sdk::signature::{Keypair, Signer};
use spl_governance::{error::GovernanceError, instruction::deposit_governing_tokens};

#[tokio::test]
async fn test_deposit_capital() {

    // Arrange
    // let mut governance_test = GovernanceProgramTest::start_new().await;
    // let realm_cookie = governance_test.with_realm().await;

    assert_eq!(1, 2);

}
