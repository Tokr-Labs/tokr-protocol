use anchor_lang::prelude::*;

#[error_code]
pub enum IdentityVerificationErrorCode {
    #[msg("Unexpected Status")]
    UnknownStatus,
    #[msg("Not Authorized")]
    NotAuthorized,
}