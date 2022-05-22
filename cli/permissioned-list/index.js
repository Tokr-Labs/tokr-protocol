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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_cluster_1 = require("../utils/get-cluster");
const resolve_home_1 = require("../utils/resolve-home");
const create_list_1 = require("./commands/create-list");
const delete_list_1 = require("./commands/delete-list");
const add_user_1 = require("./commands/add-user");
const check_list_1 = require("./commands/check-list");
const remove_user_1 = require("./commands/remove-user");
const path_1 = __importDefault(require("path"));
const load_keypair_1 = require("../utils/load-keypair");
const web3_js_1 = require("@solana/web3.js");
function getLocalnetProgramId() {
    return __awaiter(this, void 0, void 0, function* () {
        const keypairPath = path_1.default.resolve("../target/deploy/permissioned_list-keypair.json");
        try {
            const keypair = yield (0, load_keypair_1.loadKeypair)(keypairPath);
            return keypair.publicKey.toBase58();
        }
        catch (_a) {
            console.warn(`Keypair was not found at: ${keypairPath}.`);
            return web3_js_1.Keypair.generate().publicKey.toBase58();
        }
    });
}
function getProgramId() {
    return __awaiter(this, void 0, void 0, function* () {
        const cluster = yield (0, get_cluster_1.getCluster)();
        const devnet = "Hwh92WNAfui11wsSEgkyowFEkG3Kb6ALTQrTTQSxfL26";
        const mainnet = "permXeEzAzbSbtDS6CZxodr6iP3fP8B8Gvid1vXMpvM";
        const localnet = yield getLocalnetProgramId();
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
exports.default = ((program) => __awaiter(void 0, void 0, void 0, function* () {
    const programId = yield getProgramId();
    const defaultListId = "HZvsgSw2u3CNEN1dms58NgJ68K2rWYk1Bb7rsFcymDQj";
    const command = program.command("permissioned-list")
        .description("Utility functions for CRUD operations for on-chain permissioned lists.")
        .alias("perm");
    command.command("create-list")
        .description("Creates a list.")
        .alias("create")
        .option("-s, --signer <keypair>, '~/.config/solana/id.json'", "Signer keypair of the transaction.")
        .option(`-p, --program <public-key>, ${programId}`, "Public key of the on-chain permissioned list program.")
        .action((opts) => __awaiter(void 0, void 0, void 0, function* () {
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
    command.command("delete-list")
        .description("Creates a list.")
        .alias("delete")
        .option("-s, --signer <keypair>, '~/.config/solana/id.json'", "Signer keypair of the transaction.")
        .option(`-l, --list <public-key>, '${defaultListId}'`, "Public key of the list to delete.")
        .option(`-p, --program <public-key>, ${programId}`, "Public key of the on-chain permissioned list program.")
        .action((opts) => __awaiter(void 0, void 0, void 0, function* () {
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
    command.command("add-user")
        .alias("add")
        .description("Adds a user to a permissioned list.")
        .option("-s, --signer <keypair>, '~/.config/solana/id.json'", "Signer keypair of the transaction.")
        .requiredOption("-u, --user <public-key>", "The user to add to the permissioned list.")
        .option(`-p, --program <public-key>, ${programId}`, "Public key of the on-chain permissioned list program.")
        .action((opts) => __awaiter(void 0, void 0, void 0, function* () {
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
    command.command("check-list")
        .alias("check")
        .description("Checks if the given user is on a specific permissioned list.")
        .requiredOption("-u, --user <public-key>", "Public key of user who is being checked if on the list.")
        .option(`-p, --program <public-key>, ${programId}`, "Public key of the on-chain permissioned list program.")
        .action((opts) => __awaiter(void 0, void 0, void 0, function* () {
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
    command.command("remove-user")
        .description("")
        .alias("remove")
        .option("-s, --signer <keypair>, '~/.config/solana/id.json'", "Signer keypair of the transaction.")
        .requiredOption("-u, --user <public-key>", "Public key of the user who should be removed from the list.")
        .option(`-p, --program <public-key>, ${programId}`, "Public key of the on-chain permissioned list program.")
        .action((opts) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
