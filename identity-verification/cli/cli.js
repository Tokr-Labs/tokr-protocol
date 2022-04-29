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
const create_record_1 = require("./commands/create-record");
const get_record_1 = require("./commands/get-record");
const update_record_1 = require("./commands/update-record");
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const program = new commander_1.Command();
        program
            .name("tokr-identity-verification")
            .description("CLI to manage identity verification offline")
            .version("0.1.0");
        program.command("create-record")
            .description("Creates a identity verification record for a user and sets its authority.")
            .requiredOption("-u, --user <string>", "Keypair file location of user who is going to have a record about.")
            .requiredOption("-a, --authority <string>", "PublicKey of account that will have authority over the identity-verification account.")
            .requiredOption("-g, --group <string>", "PublicKey of account that will have authority over the identity-verification account.")
            .requiredOption("-p, --program <string>", "PublicKey on-chain identity verification program.")
            .action((options) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, create_record_1.createRecord)(options);
            }
            catch (error) {
                console.log(error);
            }
        }));
        program.command("get-record")
            .description("Gets the information assoaciated with a record.")
            .requiredOption("-u, --user <string>", "PublicKey of user who the record is about.")
            .requiredOption("-g, --group <string>", "Keypair file location of account that will have authority over the identity-verification account.")
            .requiredOption("-p, --program <string>", "PublicKey on-chain identity verification program.")
            .action((options) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, get_record_1.getIdentityVerificationRecord)(options);
            }
            catch (error) {
                console.log(error);
            }
        }));
        program.command("approve-record")
            .description("Approves the given record and sets all statuses to approved.")
            .requiredOption("-u, --user <string>", "PublicKey of user who the record is about.")
            .requiredOption("-a, --authority <string>", "Keypair file location of account that will have authority over the identity-verification account.")
            .requiredOption("-g, --group <string>", "Keypair file location of account that will have authority over the identity-verification account.")
            .requiredOption("-p, --program <string>", "PublicKey on-chain identity verification program.")
            .action((options) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, update_record_1.updateRecord)(options, true);
            }
            catch (error) {
                console.log(error);
            }
        }));
        program.command("deny-record")
            .description("Denies the given record and sets all statuses to denied.")
            .requiredOption("-u, --user <string>", "PublicKey of user who the record is about.")
            .requiredOption("-a, --authority <string>", "Keypair file location of account that will have authority over the identity-verification account.")
            .requiredOption("-g, --group <string>", "Keypair file location of account that will have authority over the identity-verification account.")
            .requiredOption("-p, --program <string>", "PublicKey on-chain identity verification program.")
            .action((options) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, update_record_1.updateRecord)(options, false);
            }
            catch (error) {
                console.log(error);
            }
        }));
        yield program.parseAsync();
    });
})();
