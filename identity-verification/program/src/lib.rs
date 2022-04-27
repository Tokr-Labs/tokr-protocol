use anchor_lang::prelude::*;
use solana_program::pubkey::PUBKEY_BYTES;

declare_id!("JDS6WitBF654whkcWz5i5HX1ixska8Je4ahw7XYS7h5A");

const DISCRIMINATOR_LENGTH: usize = 8;
const STATUS_LENGTH: usize = 1;
const BUMP_LENGTH: usize = 1;

#[program]
mod identity_verification {
    use super::*;

    /// Create a record of kyc/aml metadata for the user.
    pub fn create_record(
        ctx: Context<CreateRecord>,
        bump: u8,
        _group: Pubkey,
    ) -> Result<()> {

        ctx.accounts.record.aml_status = 0;
        ctx.accounts.record.ia_status = 0;
        ctx.accounts.record.kyc_status = 0;
        ctx.accounts.record.bump = bump;
        ctx.accounts.record.authority = ctx.accounts.authority.key.clone();

        Ok(())
    }

    /// Update accreditation status of account
    pub fn update_ia_status(
        ctx: Context<UpdateRecord>,
        _bump: u8,
        _group: Pubkey,
        status: u8,
    ) -> Result<()> {
        let authority = &mut ctx.accounts.authority;
        require!(ctx.accounts.record.authority.key() == authority.key.clone(), ErrorCode::NotAuthorized);

        require!(status <= 3, ErrorCode::UnknownStatus);
        ctx.accounts.record.ia_status = status;

        Ok(())
    }

    /// Update aml status of account
    pub fn update_aml_status(
        ctx: Context<UpdateRecord>,
        _bump: u8,
        _group: Pubkey,
        status: u8,
    ) -> Result<()> {
        let authority = &mut ctx.accounts.authority;
        require!(ctx.accounts.record.authority.key() == authority.key.clone(), ErrorCode::NotAuthorized);

        require!(status <= 3, ErrorCode::UnknownStatus);
        ctx.accounts.record.aml_status = status;

        Ok(())
    }

    /// Update kyc status of account
    pub fn update_kyc_status(
        ctx: Context<UpdateRecord>,
        _bump: u8,
        _group: Pubkey,
        status: u8,
    ) -> Result<()> {
        let authority = &mut ctx.accounts.authority;
        require!(ctx.accounts.record.authority.key() == authority.key.clone(), ErrorCode::NotAuthorized);

        require!(status <= 3, ErrorCode::UnknownStatus);
        ctx.accounts.record.kyc_status = status;

        Ok(())
    }

    pub fn transfer_authority(
        ctx: Context<TransferAuthority>,
        _bump: u8,
        _group: Pubkey,
    ) -> Result<()> {

        let transfer_from = &mut ctx.accounts.transfer_from;
        let transfer_to = &mut ctx.accounts.transfer_to;

        require!(ctx.accounts.record.authority.key() == transfer_from.key.clone(), ErrorCode::NotAuthorized);

        ctx.accounts.record.authority = transfer_to.key.clone();

        Ok(())

    }
}

#[derive(Accounts)]
#[instruction(bump: u8, group: Pubkey)]
pub struct CreateRecord<'info> {
    /// Assigns the account as the signer of the transaction
    #[account(mut)]
    pub signer: Signer<'info>,

    /// Creates the account via a CPI to the system program and initializes it (sets its account discriminator).
    /// Marks the account as mutable and is mutually exclusive with mut.
    /// Makes the account rent exempt unless skipped with rent_exempt = skip.
    #[account(init, seeds = [group.as_ref(), signer.key.as_ref()], bump, payer = signer, space = Metadata::LEN)]
    pub record: Account<'info, Metadata>,

    pub system_program: Program<'info, System>,
    pub authority: SystemAccount<'info>,
}

#[derive(Accounts)]
#[instruction(bump: u8, group: Pubkey)]
pub struct UpdateRecord<'info> {
    /// Checks that given account is a PDA derived from the currently executing program, the seeds,
    /// and if provided, the bump. If not provided, anchor uses the canonical bump.
    #[account(mut, seeds = [group.as_ref(), subject.key.as_ref()], bump)]
    pub record: Account<'info, Metadata>,

    /// Type validating that the account is owned by the system program. This is the account of who
    /// the record is about and should have been created by the system account ensuring that it is
    /// an actual user account.
    pub subject: SystemAccount<'info>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(bump: u8, group: Pubkey)]
pub struct TransferAuthority<'info> {

    #[account(mut, seeds = [group.as_ref(), subject.key.as_ref()], bump)]
    pub record: Account<'info, Metadata>,
    pub subject: SystemAccount<'info>,
    pub transfer_to: SystemAccount<'info>,
    pub transfer_from: Signer<'info>,

}

#[derive(Default)]
#[account]
pub struct Metadata {
    /// bump seed used in deriving the pda for the status account
    pub bump: u8,

    /// Accreditation status of the user (0 == initial, 1 == started, 2 == approved, 3 == rejected).
    pub ia_status: u8,

    /// AML status of the user (0 == initial, 1 == started, 2 == approved, 3 == rejected).
    pub aml_status: u8,

    /// KYC status of the user (0 == initial, 1 == started, 2 == approved, 3 == rejected).
    pub kyc_status: u8,

    /// Account who has update authority over the account
    authority: Pubkey,
}

impl Metadata {
    const LEN: usize = DISCRIMINATOR_LENGTH +
        (STATUS_LENGTH * 3) +
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