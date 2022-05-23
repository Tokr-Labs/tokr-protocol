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
const { Command } = require("commander");
const program = new Command();
const { createDao } = require("./commands/create-dao");
process.on('unhandledRejection', function (error) {
    console.log(error);
});
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        program
            .name("tokr-governance-cli")
            .description("CLI to manage whitelists offline")
            .version("0.1.0");
        program.command("create-dao")
            .description("Creates a DAO in accordance to the tokr-governance library.")
            .requiredOption("-i, --input-file <string>", "Keypair file location of user who is going to have a record about.")
            .action((options) => __awaiter(this, void 0, void 0, function* () {
            yield createDao(options.inputFile);
        }));
        yield program.parseAsync();
    });
})();
