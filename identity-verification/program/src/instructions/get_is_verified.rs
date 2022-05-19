use anchor_lang::prelude::*;

use crate::state::identity_record::*;

/// Create a record of kyc/aml metadata for the user.
pub fn get_is_verified(
    ctx: Context<IsVerified>,
    _bump: u8,
    _group: Pubkey,
) -> Result<bool> {

    let mut is_verified =  false;
    let record = &ctx.accounts.record;

    if record.ia_status == 2 && record.kyc_status == 2 && record.aml_status == 2 {
        is_verified = true
    }

    Ok(is_verified)

}

#[derive(Accounts)]
#[instruction(bump: u8, group: Pubkey)]
pub struct IsVerified<'info> {
    /// CHECK: We're just grabbing the using the the key off this account to derive a pda
    pub subject: AccountInfo<'info>,
    #[account(seeds = [b"identity", group.as_ref(), subject.key.as_ref()], bump = bump)]
    pub record: Account<'info, IdentityRecord>,
}