"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.checkList = void 0;
const web3_js_1 = require("@solana/web3.js");
const load_keypair_1 = require("../utils/load-keypair");
const process_1 = __importDefault(require("process"));
const get_rpc_url_1 = require("../utils/get-rpc-url");
const anchor = __importStar(require("@project-serum/anchor"));
function checkList(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const signerKeypair = yield (0, load_keypair_1.loadKeypair)(options.signer);
        const userPublicKey = new web3_js_1.PublicKey(options.user);
        process_1.default.env.ANCHOR_PROVIDER_URL = yield (0, get_rpc_url_1.getRpcUrl)();
        const program = anchor.workspace.PermissionedList;
        const [listPdaPublicKey] = yield web3_js_1.PublicKey.findProgramAddress([
            Buffer.from("list", "utf-8"),
            signerKeypair.publicKey.toBytes()
        ], program.programId);
        const [entryPdaPubkey] = yield web3_js_1.PublicKey.findProgramAddress([
            listPdaPublicKey.toBytes(),
            userPublicKey.toBytes()
        ], program.programId);
        console.log(`Checking list '${listPdaPublicKey.toBase58()}' for user '${userPublicKey.toBase58()}'...`);
        const record = yield anchor.getProvider().connection.getAccountInfo(entryPdaPubkey, "confirmed");
        if (record) {
            console.log("User is on the list.");
        }
        else {
            console.log("User is not on the list.");
        }
        process_1.default.exit(1);
    });
}
exports.checkList = checkList;
