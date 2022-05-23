#!/usr/bin/env node

import commander, {Command} from "commander";
import {generateCapTable} from "./commands/generate-cap-table";

export default (async (program: Command) => {

    const command = program.command("cap-table")
        .description("generate and interact with spl-token cap tables.")
        .alias("cap");

    command.command("generate")
        .description("generates a captable for the given spl token.")
        .requiredOption(
            "-m, --mint <public-key>",
            "The public key of the captable",
        )
        .requiredOption(
            "-t, --treasury-stock-account <public-key>",
            "account that holds non-issued tokens for the mint.",
        )
        .option(
            `-e, --endpoint <path>, http://localhost:8899`,
            "cluster endpoint, defaults to 'http://localhost:8899'.",
        )
        .option(
            `--excluded-accounts <public-key[]>`,
            "comma separated list of accounts to exclude from the cap table. Defaults to an empty string.",
        )
        .option(
            `-o, --output <path>`,
            "path to output the cap table to. If not passed the command will just print the cap-table to the standard output.",
        )
        .action(async (opts) => {

            let options = opts

            if (!options.endpoint) {
                options.endpoint = "http://localhost:8899"
            }

            if (!options.excludedAccounts) {
                options.excludedAccounts = "";
            }

            try {
                await generateCapTable(options)
            } catch (error) {
                console.error(error)
            }

        });

});