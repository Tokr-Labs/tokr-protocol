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
exports.getIdentityVerificationRecord = void 0;
const fs_1 = __importDefault(require("fs"));
const index_1 = require("../../js/src/index");
const web3_js_1 = require("@solana/web3.js");
function getIdentityVerificationRecord(options) {
    return __awaiter(this, void 0, void 0, function* () {
        let userPubkey = new web3_js_1.PublicKey(options.user);
        let programPublicKey = new web3_js_1.PublicKey(options.program);
        let groupPublicKey = new web3_js_1.PublicKey(options.group);
        // @ts-ignore
        const content = fs_1.default.readFileSync(process.env.CONFIG.toString());
        const config = content.toString();
        let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")[1];
        rpcUrl = rpcUrl.replace(/(")+/gi, "");
        const record = yield (0, index_1.getRecord)(new web3_js_1.Connection(rpcUrl), userPubkey, groupPublicKey, programPublicKey);
        console.log(`Record Authority: ${record.authority}`);
        console.log(`KYC Status: ${record.kycStatus}`);
        console.log(`AML Status: ${record.amlStatus}`);
        console.log(`Investor Accreditation Status: ${record.iaStatus}`);
        process.exit(1);
    });
}
exports.getIdentityVerificationRecord = getIdentityVerificationRecord;
