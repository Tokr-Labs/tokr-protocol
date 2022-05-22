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
exports.createRecord = void 0;
const fs_1 = __importDefault(require("fs"));
const anchor = __importStar(require("@project-serum/anchor"));
const load_keypair_1 = require("../../utils/load-keypair");
const index_1 = require("../../../programs/identity-verification/js/src/index");
const web3_js_1 = require("@solana/web3.js");
function createRecord(options) {
    return __awaiter(this, void 0, void 0, function* () {
        let userKeypair = yield (0, load_keypair_1.loadKeypair)(options.user);
        let authorityPublicKey = options.authority;
        let programPublicKey = new anchor.web3.PublicKey(options.program);
        let groupPublicKey = new anchor.web3.PublicKey(options.group);
        // @ts-ignore
        const content = fs_1.default.readFileSync(process.env.CONFIG.toString());
        const config = content.toString();
        let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")[1];
        rpcUrl = rpcUrl.replace(/(")+/gi, "");
        const commitment = rpcUrl.match(/local/) ? "processed" : "confirmed";
        const connection = new web3_js_1.Connection(rpcUrl, commitment);
        const service = (0, index_1.createIdentityVerificationServiceWith)(connection, programPublicKey);
        const tix = yield service.createRecordInstruction(userKeypair.publicKey, groupPublicKey, authorityPublicKey);
        const tx = new web3_js_1.Transaction();
        tx.add(tix);
        const txs = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [userKeypair]);
        console.log(txs);
        process.exit(1);
    });
}
exports.createRecord = createRecord;
