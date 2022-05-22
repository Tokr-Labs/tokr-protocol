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
console.warn = () => { };
const commander_1 = require("commander");
const cap_table_1 = __importDefault(require("./cap-table"));
const governance_1 = __importDefault(require("./governance"));
const identity_verification_1 = __importDefault(require("./identity-verification"));
const permissioned_list_1 = __importDefault(require("./permissioned-list"));
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const program = new commander_1.Command();
        program
            .name("tokr")
            .description("CLI to manage the tokr protocol programs.")
            .version("0.1.0");
        yield (0, cap_table_1.default)(program);
        yield (0, governance_1.default)(program);
        yield (0, identity_verification_1.default)(program);
        yield (0, permissioned_list_1.default)(program);
        yield program.parseAsync();
    });
})();
