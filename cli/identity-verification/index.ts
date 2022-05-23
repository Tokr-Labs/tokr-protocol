#!/usr/bin/env node

import {createRecord} from "./commands/create-record";
import {getIdentityVerificationRecord} from "./commands/get-record";
import {updateRecord} from "./commands/update-record";
import {Command} from "commander";

export default (async (program: Command) => {

    const command = program.command("identity-verification")
        .description("utility functions for CRUD operations to on-chain identity-verification records.")
        .alias("idv");

    command.command("create-record")
        .alias("create")
        .description("creates an identity verification record for a user and sets its authority.")
        .requiredOption(
            "-a, --authority <public-key>",
            "public key of account that will have authority over the identity-verification account.",
        )
        .requiredOption(
            "-g, --group <public-key>",
            "public key of the group the record is associated with.",
        )
        .requiredOption(
            "-p, --program <public-key>",
            "public key of the on-chain identity verification program.",
        )
        .requiredOption(
            "-u, --user <keypair>",
            "keypair of user whom the record is about.",
        )
        .action(async (options) => {

            try {
                await createRecord(options)
            } catch (error) {
                console.log(error)
            }

        });

    command.command("get-record")
        .description("retrieves the identification record given the passed options.")
        .alias("get")
        .requiredOption(
            "-g, --group <public-key>",
            "public key of the group the record is associated with.",
        )
        .requiredOption(
            "-p, --program <public-key>",
            "public key of the on-chain identity verification program.",
        )
        .requiredOption(
            "-u, --user <public-key>",
            "public key of user whom the record is about.",
        )
        .action(async (options) => {

            try {
                await getIdentityVerificationRecord(options)
            } catch (error) {
                console.log(error)
            }

        });

    command.command("approve-record")
        .description("approves the given record and sets all statuses to approved.")
        .alias("approve")
        .requiredOption(
            "-a, --authority <keypair>",
            "keypair file location of account that will have authority over the identity-verification account.",
        )
        .requiredOption(
            "-g, --group <public-key>",
            "public key of the group the record is associated with.",
        )
        .requiredOption(
            "-p, --program <public-key>",
            "public key of the on-chain identity verification program.",
        )
        .requiredOption(
            "-u, --user <public-key>",
            "public key of user whom the record is about.",
        )
        .action(async (options) => {

            try {
                await updateRecord(options, true)
            } catch (error) {
                console.log(error)
            }

        });

    command.command("deny-record")
        .description("denies the given record and sets all statuses to denied.")
        .alias("deny")
        .requiredOption(
            "-a, --authority <keypair>",
            "keypair file location of account that will have authority over the identity-verification account.",
        )
        .requiredOption(
            "-g, --group <public-key>",
            "public key of the group the record is associated with.",
        )
        .requiredOption(
            "-p, --program <public-key>",
            "public key of the on-chain identity verification program.",
        )
        .requiredOption(
            "-u, --user <public-key>",
            "public key of user whom the record is about.",
        )
        .action(async (options) => {

            try {
                await updateRecord(options, false)
            } catch (error) {
                console.log(error)
            }

        });

});
