#!/usr/bin/env node

import commander, {Command} from "commander";
import {generateCapTable} from "./commands/generate-cap-table";

export default (async (program: Command) => {

    const command = program.command("cap-table")
        .description("CLI for generating and interacting with spl-token cap tables.")
        .alias("cap");

    command.command("generate")
        .description("Generates a captable for the given spl token.")
        .requiredOption(
            "-m, --mint <public-key>",
            "The public key of the captable",
        )
        .requiredOption(
            "-t, --treasury-stock-account <public-key>",
            "Account that holds non-issued tokens for the mint.",
        )
        .option(
            `-e, --endpoint <path>, http://localhost:8899`,
            "Cluster endpoint.",
        )
        .option(
            `--excluded-accounts <public-key[]>`,
            "Comma separated list of accounts to exclude from the cap table.",
        )
        .option(
            `-o, --output <path>`,
            "Path to output the cap table to.",
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