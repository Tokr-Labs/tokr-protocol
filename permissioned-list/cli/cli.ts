#!/usr/bin/env node

import {Command} from "commander";
import {addUser} from "./commands/add-user";
import {checkList} from "./commands/check-list";
import {removeUser} from "./commands/remove-user";
import {getCluster} from "./utils/get-cluster";
import {getLocalnetProgramId} from "./utils/get-localnet-program-id";
import {resolveHome} from "./utils/resolve-home";

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

(async function main() {

    const program = new Command();
    const programId = await getProgramId();
    const defaultListId = "HZvsgSw2u3CNEN1dms58NgJ68K2rWYk1Bb7rsFcymDQj"

    program
        .name("tokr-permissioned-list")
        .description("CLI to manage an on-chain permissioned list.")
        .version("0.1.0");

    program.command("add-user")
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
            `-l, --list <public-key>, '${defaultListId}'`,
            "Public key of the list to add the user to.",
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
                options.list = "HZvsgSw2u3CNEN1dms58NgJ68K2rWYk1Bb7rsFcymDQj"
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

    program.command("check-list")
        .description("Checks if the given user is on a specific permissioned list.")
        .requiredOption(
            "-u, --user <public-key>",
            "Public key of user who is being checked if on the list.",
        )
        .option(
            `-l, --list <public-key>, '${defaultListId}'`,
            "Public key of the list to remove the user from.",
        )
        .option(
            `-p, --program <public-key>, ${programId}`,
            "Public key of the on-chain permissioned list program.",
        )
        .action(async (opts) => {

            let options = opts

            if (!options.list) {
                options.list = "HZvsgSw2u3CNEN1dms58NgJ68K2rWYk1Bb7rsFcymDQj"
            }

            if (!options.program) {
                options.program = programId
            }

            try {
                await checkList(options)
            } catch (error) {
                console.error(error)
            }

        });

    program.command("remove-user")
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
            `-l, --list <public-key>, '${defaultListId}'`,
            "Public key of the list to remove the user from.",
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
                options.list = "HZvsgSw2u3CNEN1dms58NgJ68K2rWYk1Bb7rsFcymDQj"
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

    await program.parseAsync();

})();
