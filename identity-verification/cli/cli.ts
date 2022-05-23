#!/usr/bin/env node

import {Command} from "commander";
import {createRecord} from "./commands/create-record";
import {getIdentityVerificationRecord} from "./commands/get-record";
import {updateRecord} from "./commands/update-record";

(async function main() {

    const program = new Command();

    program
        .name("tokr-identity-verification")
        .description("CLI to manage identity verification offline")
        .version("0.1.0");

    program.command("create-record")
        .description("Creates a identity verification record for a user and sets its authority.")
        .requiredOption(
            "-u, --user <string>",
            "Keypair file location of user who is going to have a record about.",
        )
        .requiredOption(
            "-a, --authority <string>",
            "PublicKey of account that will have authority over the identity-verification account.",
        )
        .requiredOption(
            "-g, --group <string>",
            "PublicKey of account that will have authority over the identity-verification account.",
        )
        .requiredOption(
            "-p, --program <string>",
            "PublicKey on-chain identity verification program.",
        )
        .action(async (options) => {

            try {
                await createRecord(options)
            } catch (error) {
                console.log(error)
            }

        });

    program.command("get-record")
        .description("Gets the information assoaciated with a record.")
        .requiredOption(
            "-u, --user <string>",
            "PublicKey of user who the record is about.",
        )
        .requiredOption(
            "-g, --group <string>",
            "Keypair file location of account that will have authority over the identity-verification account.",
        )
        .requiredOption(
            "-p, --program <string>",
            "PublicKey on-chain identity verification program.",
        )
        .action(async (options) => {

            try {
                await getIdentityVerificationRecord(options)
            } catch (error) {
                console.log(error)
            }

        });

    program.command("approve-record")
        .description("Approves the given record and sets all statuses to approved.")
        .requiredOption(
            "-u, --user <string>",
            "PublicKey of user who the record is about.",
        )
        .requiredOption(
            "-a, --authority <keypair>",
            "Keypair file location of account that will have authority over the identity-verification account.",
        )
        .requiredOption(
            "-g, --group <string>",
            "PublicKey of group the idv is for.",
        )
        .requiredOption(
            "-p, --program <string>",
            "PublicKey on-chain identity verification program.",
        )
        .action(async (options) => {

            try {
                await updateRecord(options, true)
            } catch (error) {
                console.log(error)
            }

        });

    program.command("deny-record")
        .description("Denies the given record and sets all statuses to denied.")
        .requiredOption(
            "-u, --user <string>",
            "PublicKey of user who the record is about.",
        )
        .requiredOption(
            "-a, --authority <string>",
            "Keypair file location of account that will have authority over the identity-verification account.",
        )
        .requiredOption(
            "-g, --group <string>",
            "Keypair file location of account that will have authority over the identity-verification account.",
        )
        .requiredOption(
            "-p, --program <string>",
            "PublicKey on-chain identity verification program.",
        )
        .action(async (options) => {

            try {
                await updateRecord(options, false)
            } catch (error) {
                console.log(error)
            }

        });

    await program.parseAsync();

})();
