use anchor_lang::prelude::*;

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
    ) -> Result<()> {

        ctx.accounts.record.status = 0;
        ctx.accounts.record.bump = bump;

        // set authority of who can update this whitelist record

        Ok(())
    }

    pub fn update_record(
        ctx: Context<UpdateRecord>,
        status: u8,
    ) -> Result<()> {

        // check that status is a known status (either a 1 or a 2)
        require!(status == 1 || status == 2, ErrorCode::UnknownStatus);

        ctx.accounts.record.status = status;

        Ok(())

    }

    // transfer authority instruction?

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
    pub subject: SystemAccount<'info>

}

#[account]
#[derive(Default)]
pub struct Metadata {
    pub bump: u8,
    pub status: u8
}

impl Metadata {

    const LEN: usize = DISCRIMINATOR_LENGTH +
        STATUS_LENGTH +
        BUMP_LENGTH;

}

#[error_code]
pub enum ErrorCode {
    #[msg("Unexpected status")]
    UnknownStatus,
}