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
exports.transferAuthority = exports.updateAmlStatus = exports.updateKycStatus = exports.updateIaStatus = exports.getRecord = exports.createRecordInstruction = exports.Status = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@project-serum/anchor");
const identity_verification_1 = require("./identity_verification");
const getProgramId = (connection) => {
    if (connection.rpcEndpoint.search(/dev/gi)) {
        return new web3_js_1.PublicKey("5WJNeGKQQJMaTCPgtXhmsiEK4bA6dLT94smLFmTU8Gh9");
    }
    else {
        return new web3_js_1.PublicKey("idv2F375xYuz2K7a7LxcrkhgWbPsJgpuWD3XLW1AFdD");
    }
};
/**
 * Statuses associated with kyc, aml and accreditation
 */
var Status;
(function (Status) {
    Status[Status["initial"] = 0] = "initial";
    Status[Status["started"] = 1] = "started";
    Status[Status["approved"] = 2] = "approved";
    Status[Status["denied"] = 3] = "denied";
})(Status = exports.Status || (exports.Status = {}));
/**
 * Creates and identity verification record
 * @param connection
 * @param programId The PublicKey of the on-chain identity verification program.
 * @param signer The signer of the transaction and of whom the record will be created.
 * @param group The public key of the group this record belongs to.
 * @param authority The public key of the account who will have write access to the record.
 */
const createRecordInstruction = (connection, signer, group, authority, programId) => __awaiter(void 0, void 0, void 0, function* () {
    const _programId = programId !== null && programId !== void 0 ? programId : getProgramId(connection);
    const program = new anchor_1.Program(identity_verification_1.IDL, _programId, {
        connection: connection
    });
    const [record, bump] = yield web3_js_1.PublicKey.findProgramAddress([
        group.toBuffer(),
        signer.toBuffer(),
    ], _programId);
    let txi = program.instruction.createRecord(bump, group, {
        accounts: {
            signer: signer,
            record: record,
            systemProgram: web3_js_1.SystemProgram.programId,
            authority: authority
        }
    });
    return txi;
});
exports.createRecordInstruction = createRecordInstruction;
/**
 * Retrieves a identity verification record
 * @param connection
 * @param programId The PublicKey of the on-chain identity verification program.
 * @param user The user of whom the record is about.
 * @param group The public key of the group this record belongs to.
 */
const getRecord = (connection, user, group, programId) => __awaiter(void 0, void 0, void 0, function* () {
    const _programId = programId !== null && programId !== void 0 ? programId : getProgramId(connection);
    const program = new anchor_1.Program(identity_verification_1.IDL, _programId, {
        connection: connection
    });
    const [record, bump] = yield web3_js_1.PublicKey.findProgramAddress([
        group.toBuffer(),
        user.toBuffer(),
    ], _programId);
    return yield program.account.metadata.fetch(record);
});
exports.getRecord = getRecord;
/**
 * Updates the investor accreditation status for the record
 * @param connection
 * @param programId The PublicKey of the on-chain identity verification program.
 * @param user The user of whom the record is about.
 * @param group The public key of the group this record belongs to.
 * @param signer The authority over the record that will also sign the transaction
 * @param status investor accreditation status
 */
const updateIaStatus = (connection, user, group, signer, status, programId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if ((typeof window !== "undefined" && !((_a = window.process) === null || _a === void 0 ? void 0 : _a.hasOwnProperty("type")))) {
        throw new Error("This method is not supported in the browser");
    }
    const _programId = programId !== null && programId !== void 0 ? programId : getProgramId(connection);
    const program = new anchor_1.Program(identity_verification_1.IDL, _programId, {
        connection: connection
    });
    program.provider.sendAndConfirm = function (tx, signers, opts) {
        return anchor_1.web3.sendAndConfirmTransaction(connection, tx, signers, opts);
    };
    const [record, bump] = yield web3_js_1.PublicKey.findProgramAddress([
        group.toBuffer(),
        user.toBuffer(),
    ], _programId);
    const tx = yield program.rpc.updateIaStatus(bump, group, status, {
        accounts: {
            record: record,
            subject: user,
            authority: signer.publicKey
        },
        signers: [signer],
    });
    return tx;
});
exports.updateIaStatus = updateIaStatus;
/**
 * Updates the investor accreditation status for the record
 * @param connection
 * @param programId The PublicKey of the on-chain identity verification program.
 * @param user The user of whom the record is about.
 * @param group The public key of the group this record belongs to.
 * @param signer The authority over the record that will also sign the transaction
 * @param status kyc status
 */
const updateKycStatus = (connection, user, group, signer, status, programId) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    if ((typeof window !== "undefined" && !((_b = window.process) === null || _b === void 0 ? void 0 : _b.hasOwnProperty("type")))) {
        throw new Error("This method is not supported in the browser");
    }
    const _programId = programId !== null && programId !== void 0 ? programId : getProgramId(connection);
    const program = new anchor_1.Program(identity_verification_1.IDL, _programId, {
        connection: connection
    });
    program.provider.sendAndConfirm = function (tx, signers, opts) {
        return anchor_1.web3.sendAndConfirmTransaction(connection, tx, signers, opts);
    };
    const [record, bump] = yield web3_js_1.PublicKey.findProgramAddress([
        group.toBuffer(),
        user.toBuffer(),
    ], _programId);
    const tx = yield program.rpc.updateKycStatus(bump, group, status, {
        accounts: {
            record: record,
            subject: user,
            authority: signer.publicKey
        },
        signers: [signer],
    });
    return tx;
});
exports.updateKycStatus = updateKycStatus;
/**
 * Updates the investor accreditation status for the record
 * @param connection
 * @param programId The PublicKey of the on-chain identity verification program.
 * @param user The user of whom the record is about.
 * @param group The public key of the group this record belongs to.
 * @param signer The authority over the record that will also sign the transaction
 * @param status aml status
 */
const updateAmlStatus = (connection, user, group, signer, status, programId) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    if ((typeof window !== "undefined" && !((_c = window.process) === null || _c === void 0 ? void 0 : _c.hasOwnProperty("type")))) {
        throw new Error("This method is not supported in the browser");
    }
    const _programId = programId !== null && programId !== void 0 ? programId : getProgramId(connection);
    const program = new anchor_1.Program(identity_verification_1.IDL, _programId, {
        connection: connection
    });
    program.provider.sendAndConfirm = function (tx, signers, opts) {
        return anchor_1.web3.sendAndConfirmTransaction(connection, tx, signers, opts);
    };
    const [record, bump] = yield web3_js_1.PublicKey.findProgramAddress([
        group.toBuffer(),
        user.toBuffer(),
    ], _programId);
    const tx = yield program.rpc.updateAmlStatus(bump, group, status, {
        accounts: {
            record: record,
            subject: user,
            authority: signer.publicKey
        },
        signers: [signer],
    });
    return tx;
});
exports.updateAmlStatus = updateAmlStatus;
/**
 *
 * @param connection
 * @param programId The PublicKey of the on-chain identity verification program.
 * @param user The user of whom the record is about.
 * @param group The public key of the group this record belongs to.
 * @param currentAuthority The public key of the account that currently has update authority.
 * @param newAuthority The public key that update authority will be given to.
 */
const transferAuthority = (connection, user, group, currentAuthority, newAuthority, programId) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    if ((typeof window !== "undefined" && !((_d = window.process) === null || _d === void 0 ? void 0 : _d.hasOwnProperty("type")))) {
        throw new Error("This method is not supported in the browser");
    }
    const _programId = programId !== null && programId !== void 0 ? programId : getProgramId(connection);
    const program = new anchor_1.Program(identity_verification_1.IDL, _programId, {
        connection: connection
    });
    program.provider.sendAndConfirm = function (tx, signers, opts) {
        return anchor_1.web3.sendAndConfirmTransaction(connection, tx, signers, opts);
    };
    const [record, bump] = yield web3_js_1.PublicKey.findProgramAddress([
        group.toBuffer(),
        user.toBuffer(),
    ], _programId);
    const tx = yield program.rpc.transferAuthority(bump, group, {
        accounts: {
            record: record,
            subject: user,
            transferTo: currentAuthority.publicKey,
            transferFrom: newAuthority
        },
        signers: [currentAuthority],
    });
    return tx;
});
exports.transferAuthority = transferAuthority;
