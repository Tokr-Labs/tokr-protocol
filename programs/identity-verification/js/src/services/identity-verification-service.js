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
exports.IdentityVerificationService = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@project-serum/anchor");
const idl_1 = require("../models/idl");
const identity_record_1 = require("../models/identity-record");
class IdentityVerificationService {
    // ============================================================
    // === Public API =============================================
    // ============================================================
    /**
     * Constructor
     * @param connection Connection to use for rpc calls
     * @param pid On-chain identity verification program id
     */
    constructor(connection, pid) {
        this.connection = connection;
        this.pid = pid;
        this.programId = pid !== null && pid !== void 0 ? pid : this.deterministicProgramId;
        this.program = new anchor_1.Program(idl_1.IDL, this.programId, {
            connection: this.connection
        });
        this.program.provider.sendAndConfirm = function (tx, signers, opts) {
            return anchor_1.web3.sendAndConfirmTransaction(connection, tx, signers, opts);
        };
    }
    /**
     * Creates and identity verification record
     * @param signer The signer of the transaction and of whom the record will be created.
     * @param group The public key of the group this record belongs to.
     * @param authority The public key of the account who will have write access to the record.
     */
    createRecordInstruction(signer, group, authority) {
        return __awaiter(this, void 0, void 0, function* () {
            const [record, bump] = yield web3_js_1.PublicKey.findProgramAddress([
                Buffer.from("identity"),
                group.toBuffer(),
                signer.toBuffer(),
            ], this.programId);
            return yield this.program.methods.createRecord(bump, group)
                .accounts({
                signer: signer,
                record: record,
                systemProgram: web3_js_1.SystemProgram.programId,
                authority: authority
            })
                .instruction();
        });
    }
    /**
     * Retrieves an identity verification record
     * @param user The user of whom the record is about.
     * @param group The public key of the group this record belongs to.
     */
    getRecord(user, group) {
        return __awaiter(this, void 0, void 0, function* () {
            const [record] = yield web3_js_1.PublicKey.findProgramAddress([
                Buffer.from("identity"),
                group.toBuffer(),
                user.toBuffer(),
            ], this.programId);
            const info = yield this.program.account.identityRecord.fetch(record);
            return identity_record_1.IdentityRecord.with(info, record);
        });
    }
    /**
     * Updates the investor accreditation status for the record
     * @param user The user of whom the record is about.
     * @param group The public key of the group this record belongs to.
     * @param signer The authority over the record that will also sign the transaction
     * @param status investor accreditation status
     */
    updateIaStatus(user, group, signer, status) {
        return __awaiter(this, void 0, void 0, function* () {
            // this method is not available in the browser
            this.checkEnvironment();
            const [record, bump] = yield web3_js_1.PublicKey.findProgramAddress([
                Buffer.from("identity"),
                group.toBuffer(),
                user.toBuffer(),
            ], this.programId);
            return yield this.program.methods.updateIaStatus(bump, group, status)
                .accounts({
                record: record,
                subject: user,
                authority: signer.publicKey
            })
                .signers([signer])
                .rpc();
        });
    }
    /**
     * Updates the investor kyc status for the record
     * @param user The user of whom the record is about.
     * @param group The public key of the group this record belongs to.
     * @param signer The authority over the record that will also sign the transaction
     * @param status kyc status
     */
    updateKycStatus(user, group, signer, status) {
        return __awaiter(this, void 0, void 0, function* () {
            // this method is not available in the browser
            this.checkEnvironment();
            const [record, bump] = yield web3_js_1.PublicKey.findProgramAddress([
                Buffer.from("identity"),
                group.toBuffer(),
                user.toBuffer(),
            ], this.programId);
            return yield this.program.methods.updateKycStatus(bump, group, status)
                .accounts({
                record: record,
                subject: user,
                authority: signer.publicKey
            })
                .signers([signer])
                .rpc();
        });
    }
    /**
     * Updates the investor aml status for the record
     * @param user The user of whom the record is about.
     * @param group The public key of the group this record belongs to.
     * @param signer The authority over the record that will also sign the transaction
     * @param status aml status
     */
    updateAmlStatus(user, group, signer, status) {
        return __awaiter(this, void 0, void 0, function* () {
            // this method is not available in the browser
            this.checkEnvironment();
            const [record, bump] = yield web3_js_1.PublicKey.findProgramAddress([
                Buffer.from("identity"),
                group.toBuffer(),
                user.toBuffer(),
            ], this.programId);
            return yield this.program.methods.updateAmlStatus(bump, group, status)
                .accounts({
                record: record,
                subject: user,
                authority: signer.publicKey
            })
                .signers([signer])
                .rpc();
        });
    }
    /**
     * Transfers the authority of the record to another account
     * @param user The user of whom the record is about.
     * @param group The public key of the group this record belongs to.
     * @param currentAuthority The public key of the account that currently has update authority.
     * @param newAuthority The public key that update authority will be given to.
     */
    transferAuthority(user, group, currentAuthority, newAuthority) {
        return __awaiter(this, void 0, void 0, function* () {
            // this method is not available in the browser
            this.checkEnvironment();
            const [record, bump] = yield web3_js_1.PublicKey.findProgramAddress([
                Buffer.from("identity"),
                group.toBuffer(),
                user.toBuffer(),
            ], this.programId);
            return yield this.program.methods.transferAuthority(bump, group)
                .accounts({
                record: record,
                subject: user,
                transferTo: newAuthority,
                transferFrom: currentAuthority.publicKey
            })
                .signers([currentAuthority])
                .rpc();
        });
    }
    /**
     * Deletes a record of the passed user account. It also returns the rent to the user whom it's about.
     * @param user The user of whom the record is about.
     * @param group The public key of the group this record belongs to.
     * @param signer The keypair of the account that currently has update authority.
     */
    deleteRecord(user, group, signer) {
        return __awaiter(this, void 0, void 0, function* () {
            // this method is not available in the browser
            this.checkEnvironment();
            const [record, bump] = yield web3_js_1.PublicKey.findProgramAddress([
                Buffer.from("identity"),
                group.toBuffer(),
                user.toBuffer(),
            ], this.programId);
            return yield this.program.methods.deleteRecord(bump, group)
                .accounts({
                record,
                subject: user,
                signer: signer.publicKey
            })
                .signers([signer])
                .rpc();
        });
    }
    /**
     * Based on the rpc endpoint this will determine what program id to use in the methods.
     * @private
     */
    get deterministicProgramId() {
        if (this.connection.rpcEndpoint.search(/dev/gi)) {
            return new web3_js_1.PublicKey("5WJNeGKQQJMaTCPgtXhmsiEK4bA6dLT94smLFmTU8Gh9");
        }
        else {
            return new web3_js_1.PublicKey("idv2F375xYuz2K7a7LxcrkhgWbPsJgpuWD3XLW1AFdD");
        }
    }
    // Private Methods
    /**
     * Checks the current environment, only certain methods are callable from the browser
     * @private
     */
    checkEnvironment() {
        var _a;
        if ((typeof window !== "undefined" && !((_a = window.process) === null || _a === void 0 ? void 0 : _a.hasOwnProperty("type")))) {
            throw new Error("This method is not supported in the browser");
        }
    }
}
exports.IdentityVerificationService = IdentityVerificationService;
