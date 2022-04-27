#!/usr/bin/env node

const {Command} = require("commander");
const program = new Command();
const {createDao} = require("./commands/create-dao");

process.on('unhandledRejection', function(error) {
    console.log(error);
});

(async function main() {

    program
        .name("tokr-governance-cli")
        .description("CLI to manage whitelists offline")
        .version("0.1.0");

    program.command("create-dao")
        .description("Creates a DAO in accordance to the tokr-governance library.")
        .requiredOption(
            "-i, --input-file <string>",
            "Keypair file location of user who is going to have a record about.",
        )
        .action(async (options: any) => {

            await createDao(options.inputFile)

        });

    await program.parseAsync();

})();
