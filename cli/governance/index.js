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
const { createDao } = require("./commands/create-dao");
exports.default = ((program) => __awaiter(void 0, void 0, void 0, function* () {
    const command = program.command("governance")
        .description("Utility CLI for creating and interacting with on-chain DAO governances.")
        .alias("gov");
    command.command("create-dao")
        .alias("create")
        .description("Creates a DAO in accordance to the tokr-governance library.")
        .requiredOption("-i, --input-file <string>", "Keypair file location of user who is going to have a record about.")
        .action((options) => __awaiter(void 0, void 0, void 0, function* () {
        yield createDao(options.inputFile);
    }));
}));
