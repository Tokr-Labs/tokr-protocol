#!/usr/bin/env node

import {getCluster} from "../utils/get-cluster";
import {Command} from "commander";
import {resolveHome} from "../utils/resolve-home";
import {createList} from "./commands/create-list";
import {deleteList} from "./commands/delete-list";
import {addUser} from "./commands/add-user";
import {checkList} from "./commands/check-list";
import {removeUser} from "./commands/remove-user";
import path from "path";
import {loadKeypair} from "../utils/load-keypair";
import {Keypair} from "@solana/web3.js";

async function getLocalnetProgramId(): Promise<string> {

    const keypairPath = path.resolve("../target/deploy/permissioned_list-keypair.json");

    try {

        const keypair = await loadKeypair(keypairPath)
        return keypair.publicKey.toBase58()

    } catch {

        console.warn(`Keypair was not found at: ${keypairPath}.`)
        return Keypair.generate().publicKey.toBase58()

    }

}

async function getProgramId(): Promise<string> {

    const cluster = await getCluster()

    const devnet = "Hwh92WNAfui11wsSEgkyowFEkG3Kb6ALTQrTTQSxfL26"
    const mainnet = "permXeEzAzbSbtDS6CZxodr6iP3fP8B8Gvid1vXMpvM"
    const localnet = await getLocalnetProgramId()

    switch (cluster) {
        case "devnet":
            return devnet
        case "mainnet":
            return mainnet
        case "localnet":
            return localnet
    }

}

export default (async (program: Command) => {

    const programId = await getProgramId();
    const defaultListId = "HZvsgSw2u3CNEN1dms58NgJ68K2rWYk1Bb7rsFcymDQj"

    const command = program.command("permissioned-list")
        .description("CLI to manage an on-chain permissioned list.")

    command.command("create-list")
        .description("Creates a list.")
        .option(
            "-s, --signer <keypair>, '~/.config/solana/id.json'",
            "Signer keypair of the transaction.",
        )
        .option(
            `-p, --program <public-key>, ${programId}`,
            "Public key of the on-chain permissioned list program.",
        )
        .action(async (opts) => {

            let options = opts

            if (!options.signer) {
                options.signer = resolveHome("~/.config/solana/id.json")
            }

            if (!options.program) {
                options.program = programId
            }

            try {
                await createList(options)
            } catch (error) {
                console.error(error)
            }

        });

    command.command("delete-list")
        .description("Creates a list.")
        .option(
            "-s, --signer <keypair>, '~/.config/solana/id.json'",
            "Signer keypair of the transaction.",
        )
        .option(
            `-l, --list <public-key>, '${defaultListId}'`,
            "Public key of the list to delete.",
        )
        .option(
            `-p, --program <public-key>, ${programId}`,
            "Public key of the on-chain permissioned list program.",
        )
        .action(async (opts) => {

            let options = opts

            if (!options.signer) {
                options.signer = resolveHome("~/.config/solana/id.json")
            }

            if (!options.list) {
                options.list = defaultListId
            }

            if (!options.program) {
                options.program = programId
            }

            try {
                await deleteList(options)
            } catch (error) {
                console.error(error)
            }

        });

    command.command("add-user")
        .description("Adds a user to a permissioned list.")
        .option(
            "-s, --signer <keypair>, '~/.config/solana/id.json'",
            "Signer keypair of the transaction.",
        )
        .requiredOption(
            "-u, --user <public-key>",
            "The user to add to the permissioned list.",
        )
        .option(
            `-p, --program <public-key>, ${programId}`,
            "Public key of the on-chain permissioned list program.",
        )
        .action(async (opts) => {

            let options = opts

            if (!options.signer) {
                options.signer = resolveHome("~/.config/solana/id.json")
            }

            if (!options.program) {
                options.program = programId
            }

            try {
                await addUser(options)
            } catch (error) {
                console.error(error)
            }

        });

    command.command("check-list")
        .description("Checks if the given user is on a specific permissioned list.")
        .requiredOption(
            "-u, --user <public-key>",
            "Public key of user who is being checked if on the list.",
        )
        .option(
            `-p, --program <public-key>, ${programId}`,
            "Public key of the on-chain permissioned list program.",
        )
        .action(async (opts) => {

            let options = opts

            options.signer = resolveHome("~/.config/solana/id.json")

            if (!options.program) {
                options.program = programId
            }

            try {
                await checkList(options)
            } catch (error) {
                console.error(error)
            }

        });

    command.command("remove-user")
        .description("")
        .option(
            "-s, --signer <keypair>, '~/.config/solana/id.json'",
            "Signer keypair of the transaction.",
        )
        .requiredOption(
            "-u, --user <public-key>",
            "Public key of the user who should be removed from the list.",
        )
        .option(
            `-p, --program <public-key>, ${programId}`,
            "Public key of the on-chain permissioned list program.",
        )
        .action(async (opts) => {

            let options = opts

            if (!options.signer) {
                options.signer = resolveHome("~/.config/solana/id.json")
            }

            if (!options.program) {
                options.program = programId
            }

            try {
                await removeUser(options, true)
            } catch (error) {
                console.error(error)
            }

        });

});
