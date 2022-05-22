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
exports.updateRecord = void 0;
const load_keypair_1 = require("../../utils/load-keypair");
const fs_1 = __importDefault(require("fs"));
const web3_js_1 = require("@solana/web3.js");
const index_1 = require("../../../programs/identity-verification/js/src/index");
const identity_status_1 = require("../../../programs/identity-verification/js/src/models/identity-status");
function updateRecord(options, approve) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`${approve ? "Approving" : "Denying"} record status...`);
        let authorityKeypair = yield (0, load_keypair_1.loadKeypair)(options.authority);
        let userPublicKey = new web3_js_1.PublicKey(options.user);
        let programPublicKey = new web3_js_1.PublicKey(options.program);
        let groupPublicKey = new web3_js_1.PublicKey(options.group);
        // @ts-ignore
        const content = fs_1.default.readFileSync(process.env.CONFIG.toString());
        const config = content.toString();
        let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")[1];
        rpcUrl = rpcUrl.replace(/(")+/gi, "");
        const commitment = rpcUrl.match(/local/) ? "processed" : "confirmed";
        const connection = new web3_js_1.Connection(rpcUrl, commitment);
        const service = (0, index_1.createIdentityVerificationServiceWith)(connection, programPublicKey);
        console.log("Updating IA status...");
        const sig1 = yield service.updateIaStatus(userPublicKey, groupPublicKey, authorityKeypair, approve ? identity_status_1.IdentityStatus.approved : identity_status_1.IdentityStatus.denied);
        console.log(`IA Transaction Signature: ${sig1}`);
        console.log("Updating KYC status...");
        const sig2 = yield service.updateKycStatus(userPublicKey, groupPublicKey, authorityKeypair, approve ? identity_status_1.IdentityStatus.approved : identity_status_1.IdentityStatus.denied);
        console.log(`KYC Transaction Signature: ${sig2}`);
        console.log("Updating AML status...");
        const sig3 = yield service.updateAmlStatus(userPublicKey, groupPublicKey, authorityKeypair, approve ? identity_status_1.IdentityStatus.approved : identity_status_1.IdentityStatus.denied);
        console.log(`AML Transaction Signature: ${sig3}`);
        const record = yield service.getRecord(userPublicKey, groupPublicKey);
        console.log(`Record Authority: ${record.authority}`);
        console.log(`KYC Status: ${record.kycStatus}`);
        console.log(`AML Status: ${record.amlStatus}`);
        console.log(`IA Status: ${record.iaStatus}`);
        process.exit(1);
    });
}
exports.updateRecord = updateRecord;