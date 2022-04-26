#!/usr/bin/env node

const {Command} = require("commander");
const program = new Command();
const {createDao} = require("./commands/create-dao");

(async function main() {

    program
        .name("tokr-governance-cli")
        .description("CLI to manage whitelists offline")
        .version("0.1.0");

    program.command("create-dao")
        .description("Creates a DAO in accordance to the tokr-governance library.")
        .requiredOption(
            "--owner <string>",
            "Keypair file location of user who is going to have a record about.",
        )
        .option(
            "--cluster <string>",
            "Solana cluster to create DAO on.",
        )
        .option(
            "--name <string>",
            "Display name of the DAO.",
        )
        .requiredOption(
            "--delegate <string>",
            "The keypair of delegate for the DAO.",
        )
        .requiredOption(
            "--usdcMint <string>",
            "The USDC mint public key to use for the cluster.",
        )
        .action(async (options: any) => {

            await createDao(
                options.delegate,
                options.owner == undefined ? "~/.config/solana/id.json" : options.owner,
                options.cluster == undefined ? "http://localhost:8899" : options.cluster,
                options.name == undefined ? `DAO - ${new Date().toLocaleString()}` : options.name,
                options.usdcMint
            )

        });

    await program.parseAsync();

})();
