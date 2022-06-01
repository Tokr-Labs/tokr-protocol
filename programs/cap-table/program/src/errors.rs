use anchor_lang::prelude::*;

#[error_code]
pub enum CapTableErrorCode {
    #[msg("Generic")]
    Generic,
}