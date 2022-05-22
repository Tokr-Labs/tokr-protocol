#!/usr/bin/env node

import {Command} from "commander";
const {createDao} = require("./commands/create-dao");

export default (async (program: Command) => {

    const command = program.command("governance")
        .description("stuff for governance")

    command.command("create-dao")
        .description("Creates a DAO in accordance to the tokr-governance library.")
        .requiredOption(
            "-i, --input-file <string>",
            "Keypair file location of user who is going to have a record about.",
        )
        .action(async (options: any) => {

            await createDao(options.inputFile)

        });

})
