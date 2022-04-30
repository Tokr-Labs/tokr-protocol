use anchor_lang::prelude::*;

// declare_id!("permXeEzAzbSbtDS6CZxodr6iP3fP8B8Gvid1vXMpvM"); // mainnet
// declare_id!("Hwh92WNAfui11wsSEgkyowFEkG3Kb6ALTQrTTQSxfL26"); // devnet
declare_id!("BUWzgULd7yHyCzSuq7CVSb4HVMMpvpo2Z9cAyPVsXG5k"); // localnet

#[program]
mod permissioned_list {
    use super::*;

    /// Create a record of kyc/aml metadata for the user.
    pub fn add_user(
        ctx: Context<AddUser>,
        _bump: u8,
        _group: Pubkey,
    ) -> Result<()> {
        let pda = &mut ctx.accounts.pda;

        pda.authority = ctx.accounts.signer.key.clone();

        Ok(())
    }

    /// Update accreditation status of account
    pub fn remove_user(
        ctx: Context<RemoveUser>,
        _bump: u8,
        _group: Pubkey,
    ) -> Result<()> {
        require!(ctx.accounts.pda.authority.key() == ctx.accounts.signer.key.clone(), ErrorCode::NotAuthorized);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8, group: Pubkey)]
pub struct AddUser<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(init, seeds = [group.as_ref(), user.key.as_ref()], bump, payer = signer, space = 8 + 32)]
    pub pda: Account<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub user: SystemAccount<'info>,
}

#[derive(Accounts)]
#[instruction(bump: u8, group: Pubkey)]
pub struct RemoveUser<'info> {
    pub signer: Signer<'info>,
    #[account(mut, close = signer, seeds = [group.as_ref(), user.key.as_ref()], bump)]
    pub pda: Account<'info, Metadata>,
    pub user: SystemAccount<'info>,
}

#[derive(Default)]
#[account]
pub struct Metadata {
    authority: Pubkey
}

#[error_code]
pub enum ErrorCode {
    #[msg("Not Authorized")]
    NotAuthorized,
}