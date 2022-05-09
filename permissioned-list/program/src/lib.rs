use anchor_lang::prelude::*;

use instructions::*;

pub mod instructions;
pub mod state;
pub mod errors;

// declare_id!("permXeEzAzbSbtDS6CZxodr6iP3fP8B8Gvid1vXMpvM"); // mainnet
// declare_id!("Hwh92WNAfui11wsSEgkyowFEkG3Kb6ALTQrTTQSxfL26"); // devnet
declare_id!("BUWzgULd7yHyCzSuq7CVSb4HVMMpvpo2Z9cAyPVsXG5k"); // localnet

#[program]
mod permissioned_list {
    use super::*;

    pub fn create_list(
        ctx: Context<CreateList>
    ) -> Result<()> {
        instructions::create_list::create_list(ctx)
    }

    pub fn delete_list(
        ctx: Context<DeleteList>
    ) -> Result<()> {
        instructions::delete_list::delete_list(ctx)
    }

    pub fn add_user(
        ctx: Context<AddUser>
    ) -> Result<()> {
        instructions::add_user::add_user(ctx)
    }

    pub fn remove_user(
        ctx: Context<RemoveUser>
    ) -> Result<()> {
        instructions::remove_user::remove_user(ctx)
    }
}


