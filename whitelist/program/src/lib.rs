use anchor_lang::prelude::*;
use solana_program::pubkey::PUBKEY_BYTES;

declare_id!("JDS6WitBF654whkcWz5i5HX1ixska8Je4ahw7XYS7h5A");

const DISCRIMINATOR_LENGTH: usize = 8;
const STATUS_LENGTH: usize = 1;
const BUMP_LENGTH: usize = 1;

#[program]
mod whitelist {
    use super::*;

    pub fn create_record(
        ctx: Context<CreateRecord>,
        bump: u8,
        authority: Pubkey,
    ) -> Result<()> {
        ctx.accounts.record.status = 0;
        ctx.accounts.record.bump = bump;
        ctx.accounts.record.authority = authority;

        Ok(())
    }

    pub fn update_record(
        ctx: Context<UpdateRecord>,
        status: u8,
    ) -> Result<()> {
        let signer = &mut ctx.accounts.signer;
        let authority = &mut ctx.accounts.record.authority;

        // check that the signer is the authority of the account
        require!(signer.key == authority, ErrorCode::NotAuthorized);

        // check that the signer is the authority of the account
        require!(status == 1 || status == 2, ErrorCode::UnknownStatus);

        ctx.accounts.record.status = status;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateRecord<'info> {
    // Assigns the account as the signer of the transaction
    #[account(mut)]
    pub signer: Signer<'info>,

    // Creates the account via a CPI to the system program and initializes it (sets its account discriminator).
    // Marks the account as mutable and is mutually exclusive with mut.
    // Makes the account rent exempt unless skipped with rent_exempt = skip.
    #[account(
    init,
    seeds = [b"whitelist".as_ref(), signer.key.as_ref()],
    bump,
    payer = signer,
    space = Metadata::LEN
    )]
    pub record: Account<'info, Metadata>,

    pub system_program: Program<'info, System>,

}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct UpdateRecord<'info> {
    // Checks that given account is a PDA derived from the currently executing program, the seeds,
    // and if provided, the bump. If not provided, anchor uses the canonical bump.
    #[account(
    mut,
    seeds = [b"whitelist".as_ref(), subject.key.as_ref()],
    bump
    )]
    pub record: Account<'info, Metadata>,

    // Type validating that the account is owned by the system program
    // This is the account of who the record is about and should have been created by the system
    // account ensuring that it is an actual user account.
    pub subject: SystemAccount<'info>,

    pub signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CloseRecord<'info> {
    // Checks that given account is a PDA derived from the currently executing program, the seeds,
    // and if provided, the bump. If not provided, anchor uses the canonical bump.
    #[account(
    mut,
    seeds = [b"whitelist".as_ref(), subject.key.as_ref()],
    bump
    )]
    pub record: Account<'info, Metadata>,

    // Type validating that the account is owned by the system program
    // This is the account of who the record is about and should have been created by the system
    // account ensuring that it is an actual user account.
    pub subject: SystemAccount<'info>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct TransferRecordAuthority<'info> {
    // Checks that given account is a PDA derived from the currently executing program, the seeds,
    // and if provided, the bump. If not provided, anchor uses the canonical bump.
    #[account(
    mut,
    seeds = [b"whitelist".as_ref(), subject.key.as_ref()],
    bump
    )]
    pub record: Account<'info, Metadata>,

    // Type validating that the account is owned by the system program
    // This is the account of who the record is about and should have been created by the system
    // account ensuring that it is an actual user account.
    pub subject: SystemAccount<'info>,

}

#[account]
#[derive(Default)]
pub struct Metadata {
    pub bump: u8,
    pub status: u8,
    pub authority: Pubkey,
}

impl Metadata {
    const LEN: usize = DISCRIMINATOR_LENGTH +
        STATUS_LENGTH +
        BUMP_LENGTH +
        PUBKEY_BYTES;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unexpected Status")]
    UnknownStatus,
    #[msg("Not Authorized")]
    NotAuthorized,
}