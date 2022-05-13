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
const build_cap_table_1 = require("./commands/build-cap-table");
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const program = new commander_1.Command();
        program
            .name("tokr-captable")
            .description("CLI to get cap table information for an spl token.")
            .version("0.1.0");
        program.command("build-cap-table")
            .description("Generates a captable for the given spl token.")
            .requiredOption("-m, --mint <public-key>", "The public key of the captable")
            .requiredOption("-t, --treasury-stock-account <public-key>", "Account that holds non-issued tokens for the mint.")
            .option(`-e, --endpoint <path>, http://localhost:8899`, "Cluster endpoint.")
            .option(`--excluded-accounts <public-key[]>`, "Comma separated list of accounts to exclude from the cap table.")
            .option(`-o, --output <path>`, "Path to output the cap table to.")
            .action((opts) => __awaiter(this, void 0, void 0, function* () {
            let options = opts;
            if (!options.endpoint) {
                options.endpoint = "http://localhost:8899";
            }
            if (!options.excludedAccounts) {
                options.excludedAccounts = "";
            }
            try {
                yield (0, build_cap_table_1.buildCapTable)(options);
            }
            catch (error) {
                console.error(error);
            }
        }));
        yield program.parseAsync();
    });
})();
