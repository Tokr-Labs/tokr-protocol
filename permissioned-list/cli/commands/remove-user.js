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
exports.removeUser = void 0;
const web3_js_1 = require("@solana/web3.js");
const load_keypair_1 = require("../utils/load-keypair");
function removeUser(options, approve) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Removing user '${options.user}' from list '${options.list}'...`);
        const signer = yield (0, load_keypair_1.loadKeypair)(options.signer);
        const user = new web3_js_1.PublicKey(options.user);
        const list = new web3_js_1.PublicKey(options.list);
        const program = new web3_js_1.PublicKey(options.program);
        process.exit(1);
    });
}
exports.removeUser = removeUser;
