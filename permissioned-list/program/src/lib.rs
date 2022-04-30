use anchor_lang::prelude::*;

// declare_id!("permXeEzAzbSbtDS6CZxodr6iP3fP8B8Gvid1vXMpvM"); // mainnet
// declare_id!("Hwh92WNAfui11wsSEgkyowFEkG3Kb6ALTQrTTQSxfL26"); // devnet
declare_id!("BUWzgULd7yHyCzSuq7CVSb4HVMMpvpo2Z9cAyPVsXG5k"); // localnet

#[program]
mod permissioned_list {
    use super::*;

    pub fn create_list(
        ctx: Context<CreateList>
    ) -> Result<()> {
        let list = &mut ctx.accounts.list;
        let signer = &mut ctx.accounts.signer;

        list.authority = signer.key.clone();

        Ok(())
    }

    pub fn delete_list(
        ctx: Context<DeleteList>
    ) -> Result<()> {
        let list = &mut ctx.accounts.list;
        let signer = &mut ctx.accounts.signer;

        require!(list.authority == signer.key.clone(), ErrorCode::NotAuthorized);
        Ok(())
    }

    pub fn add_user(
        ctx: Context<AddUser>
    ) -> Result<()> {
        let list = &mut ctx.accounts.list;
        let signer = &mut ctx.accounts.signer;

        require!(list.authority == signer.key.clone(), ErrorCode::NotAuthorized);

        Ok(())
    }

    pub fn remove_user(
        ctx: Context<RemoveUser>
    ) -> Result<()> {
        let list = &mut ctx.accounts.list;
        let signer = &mut ctx.accounts.signer;

        require!(list.authority == signer.key.clone(), ErrorCode::NotAuthorized);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateList<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
    init,
    seeds = [b"list", signer.key.as_ref()], bump,
    payer = signer,
    space = 8 + 32
    )]
    pub list: Account<'info, ListMetadata>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeleteList<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
    mut,
    close = signer,
    seeds = [b"list", signer.key.as_ref()], bump,
    )]
    pub list: Account<'info, ListMetadata>,
}

#[derive(Accounts)]
pub struct AddUser<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
    mut,
    seeds = [b"list", signer.key.as_ref()], bump
    )]
    pub list: Account<'info, ListMetadata>,
    #[account(
    init,
    seeds = [list.key().as_ref(), user.key.as_ref()], bump,
    payer = signer,
    space = 8
    )]
    pub entry: Account<'info, EntryMetadata>,
    #[account(mut)]
    pub user: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveUser<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"list", signer.key.as_ref()], bump
    )]
    pub list: Account<'info, ListMetadata>,
    #[account(
        mut,
        close = signer,
        seeds = [list.key().as_ref(), user.key.as_ref()], bump,
    )]
    pub entry: Account<'info, EntryMetadata>,
    #[account(mut)]
    pub user: SystemAccount<'info>,
}

#[derive(Default)]
#[account]
pub struct ListMetadata {
    authority: Pubkey,
}

#[derive(Default)]
#[account]
pub struct EntryMetadata {}

#[error_code]
pub enum ErrorCode {
    #[msg("Not Authorized")]
    NotAuthorized,
}