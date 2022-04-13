#![deny(missing_docs)]

//! A lending program for the Solana blockchain.

pub mod entrypoint;
pub mod error;
pub mod instruction;
pub mod math;
pub mod processor;
pub mod pyth;
pub mod state;

// Export current sdk types for downstream users building with a different sdk version
pub use solana_program;

solana_program::declare_id!("EViMcQj2B7GSc1k8DnFof3xV9r4k7twrHM5LadHGrmXe");

// target/debug/spl-token-lending create-market --fee-payer ~/Documents/workspace/tokr/keys/owner-041222325.json --market-owner 6fh7tsNtQCNt2HoeNaJdynypDyA6itgAbdr3Efe37Baw --dry-run