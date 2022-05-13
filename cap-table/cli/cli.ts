#!/usr/bin/env node

import {Command} from "commander";
import {buildCapTable} from "./commands/build-cap-table";

(async function main() {

    const program = new Command();

    program
        .name("tokr-captable")
        .description("CLI to get cap table information for an spl token.")
        .version("0.1.0");

    program.command("build-cap-table")
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
                await buildCapTable(options)
            } catch (error) {
                console.error(error)
            }

        });

    await program.parseAsync();

})();
