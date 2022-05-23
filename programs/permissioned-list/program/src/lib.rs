use anchor_lang::prelude::*;

use instructions::*;

pub mod instructions;
pub mod state;
pub mod errors;

// declare_id!("permXeEzAzbSbtDS6CZxodr6iP3fP8B8Gvid1vXMpvM"); // mainnet
// declare_id!("Hwh92WNAfui11wsSEgkyowFEkG3Kb6ALTQrTTQSxfL26"); // devnet
declare_id!("9rMCpctTpKwaM1Wd6ppAgRLhbb9X3kJnZvzCrzy5kiDC"); // localnet

#[program]
mod permissioned_list {
    use super::*;

    /// Create a list
    pub fn create_list(
        ctx: Context<CreateList>
    ) -> Result<()> {
        instructions::create_list::create_list(ctx)
    }

    /// delete a list
    pub fn delete_list(
        ctx: Context<DeleteList>
    ) -> Result<()> {
        instructions::delete_list::delete_list(ctx)
    }

    /// add a user to a list
    pub fn add_user(
        ctx: Context<AddUser>
    ) -> Result<()> {
        instructions::add_user::add_user(ctx)
    }

    /// remove a user from a list
    pub fn remove_user(
        ctx: Context<RemoveUser>
    ) -> Result<()> {
        instructions::remove_user::remove_user(ctx)
    }
}


