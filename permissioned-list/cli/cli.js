#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const add_user_1 = require("./commands/add-user");
const check_list_1 = require("./commands/check-list");
const remove_user_1 = require("./commands/remove-user");
const get_cluster_1 = require("./utils/get-cluster");
const get_localnet_program_id_1 = require("./utils/get-localnet-program-id");
const resolve_home_1 = require("./utils/resolve-home");
const delete_list_1 = require("./commands/delete-list");
const create_list_1 = require("./commands/create-list");
function getProgramId() {
    return __awaiter(this, void 0, void 0, function* () {
        const cluster = yield (0, get_cluster_1.getCluster)();
        const devnet = "Hwh92WNAfui11wsSEgkyowFEkG3Kb6ALTQrTTQSxfL26";
        const mainnet = "permXeEzAzbSbtDS6CZxodr6iP3fP8B8Gvid1vXMpvM";
        const localnet = yield (0, get_localnet_program_id_1.getLocalnetProgramId)();
        switch (cluster) {
            case "devnet":
                return devnet;
            case "mainnet":
                return mainnet;
            case "localnet":
                return localnet;
        }
    });
}
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const program = new commander_1.Command();
        const programId = yield getProgramId();
        const defaultListId = "HZvsgSw2u3CNEN1dms58NgJ68K2rWYk1Bb7rsFcymDQj";
        program
            .name("tokr-permissioned-list")
            .description("CLI to manage an on-chain permissioned list.")
            .version("0.1.0");
        program.command("create-list")
            .description("Creates a list.")
            .option("-s, --signer <keypair>, '~/.config/solana/id.json'", "Signer keypair of the transaction.")
            .option(`-p, --program <public-key>, ${programId}`, "Public key of the on-chain permissioned list program.")
            .action((opts) => __awaiter(this, void 0, void 0, function* () {
            let options = opts;
            if (!options.signer) {
                options.signer = (0, resolve_home_1.resolveHome)("~/.config/solana/id.json");
            }
            if (!options.program) {
                options.program = programId;
            }
            try {
                yield (0, create_list_1.createList)(options);
            }
            catch (error) {
                console.error(error);
            }
        }));
        program.command("delete-list")
            .description("Creates a list.")
            .option("-s, --signer <keypair>, '~/.config/solana/id.json'", "Signer keypair of the transaction.")
            .option(`-l, --list <public-key>, '${defaultListId}'`, "Public key of the list to delete.")
            .option(`-p, --program <public-key>, ${programId}`, "Public key of the on-chain permissioned list program.")
            .action((opts) => __awaiter(this, void 0, void 0, function* () {
            let options = opts;
            if (!options.signer) {
                options.signer = (0, resolve_home_1.resolveHome)("~/.config/solana/id.json");
            }
            if (!options.list) {
                options.list = defaultListId;
            }
            if (!options.program) {
                options.program = programId;
            }
            try {
                yield (0, delete_list_1.deleteList)(options);
            }
            catch (error) {
                console.error(error);
            }
        }));
        program.command("add-user")
            .description("Adds a user to a permissioned list.")
            .option("-s, --signer <keypair>, '~/.config/solana/id.json'", "Signer keypair of the transaction.")
            .requiredOption("-u, --user <public-key>", "The user to add to the permissioned list.")
            .option(`-p, --program <public-key>, ${programId}`, "Public key of the on-chain permissioned list program.")
            .action((opts) => __awaiter(this, void 0, void 0, function* () {
            let options = opts;
            if (!options.signer) {
                options.signer = (0, resolve_home_1.resolveHome)("~/.config/solana/id.json");
            }
            if (!options.program) {
                options.program = programId;
            }
            try {
                yield (0, add_user_1.addUser)(options);
            }
            catch (error) {
                console.error(error);
            }
        }));
        program.command("check-list")
            .description("Checks if the given user is on a specific permissioned list.")
            .requiredOption("-u, --user <public-key>", "Public key of user who is being checked if on the list.")
            .option(`-p, --program <public-key>, ${programId}`, "Public key of the on-chain permissioned list program.")
            .action((opts) => __awaiter(this, void 0, void 0, function* () {
            let options = opts;
            options.signer = (0, resolve_home_1.resolveHome)("~/.config/solana/id.json");
            if (!options.program) {
                options.program = programId;
            }
            try {
                yield (0, check_list_1.checkList)(options);
            }
            catch (error) {
                console.error(error);
            }
        }));
        program.command("remove-user")
            .description("")
            .option("-s, --signer <keypair>, '~/.config/solana/id.json'", "Signer keypair of the transaction.")
            .requiredOption("-u, --user <public-key>", "Public key of the user who should be removed from the list.")
            .option(`-p, --program <public-key>, ${programId}`, "Public key of the on-chain permissioned list program.")
            .action((opts) => __awaiter(this, void 0, void 0, function* () {
            let options = opts;
            if (!options.signer) {
                options.signer = (0, resolve_home_1.resolveHome)("~/.config/solana/id.json");
            }
            if (!options.program) {
                options.program = programId;
            }
            try {
                yield (0, remove_user_1.removeUser)(options, true);
            }
            catch (error) {
                console.error(error);
            }
        }));
        yield program.parseAsync();
    });
})();
