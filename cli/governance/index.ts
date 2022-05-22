#!/usr/bin/env node

import {Command} from "commander";
const {createDao} = require("./commands/create-dao");

export default (async (program: Command) => {

    const command = program.command("governance")
        .description("Utility CLI for creating and interacting with on-chain DAO governances.")
        .alias("gov");

    command.command("create-dao")
        .alias("create")
        .description("Creates a DAO in accordance to the tokr-governance library.")
        .requiredOption(
            "-i, --input-file <string>",
            "Keypair file location of user who is going to have a record about.",
        )
        .action(async (options: any) => {

            await createDao(options.inputFile)

        });

})
