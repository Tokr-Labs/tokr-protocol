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
exports.CapTableService = void 0;
const spl_token_1 = require("@solana/spl-token");
const cap_table_1 = require("../models/cap-table");
const underscore_1 = require("underscore");
const cap_table_entry_1 = require("../models/cap-table-entry");
class CapTableService {
    // ============================================================
    // === Internal API ===========================================
    // ============================================================
    /**
     * Constructor
     * @param connection
     */
    constructor(connection) {
        this.connection = connection;
    }
    /**
     * Retrieves the cap table for the given mint excluding certain accounts
     * @param mintAddress Spl token mint address
     * @param treasuryStockAccount Account that holds non-issued tokens for the mint
     * @param excludedAccounts Array of account to exclude
     */
    getCapTableForMint(mintAddress, treasuryStockAccount, excludedAccounts) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const config = {
                filters: [{
                        memcmp: {
                            offset: 0,
                            bytes: mintAddress.toBase58()
                        }
                    }]
            };
            // account holding tokens of the provided mint
            let accounts = yield this.connection.getParsedProgramAccounts(spl_token_1.TOKEN_PROGRAM_ID, config);
            // total spl tokens minted
            const authorizedSupplyInfo = yield this.connection.getTokenSupply(mintAddress);
            // original holder of all minted spl tokens
            let treasuryStockAccountInfo = yield this.connection.getTokenAccountBalance(treasuryStockAccount);
            //  total minted tokens, held by both users and the treasury stock account
            const authorizedSupply = (_a = authorizedSupplyInfo.value.uiAmount) !== null && _a !== void 0 ? _a : 1;
            // amount held in the treasury stock account (could potentially be "issued" later)
            const reservedSupply = (_b = treasuryStockAccountInfo.value.uiAmount) !== null && _b !== void 0 ? _b : 0;
            // authorizedSupply less reservedSupply
            const issued = authorizedSupply - reservedSupply;
            // filter out excluded accounts
            accounts = (0, underscore_1.filter)(accounts, account => {
                // @ts-ignore
                const owner = account.account.data.parsed.info.owner;
                return !(0, underscore_1.contains)(excludedAccounts.map(excludedAccount => excludedAccount.toBase58()), owner);
            });
            // generate cap table entries for the accounts returned
            let entries = accounts.map(account => {
                var _a;
                // @ts-ignore
                const parsed = account.account.data.parsed;
                const accountInfo = parsed.info;
                const owner = accountInfo.owner;
                // @ts-ignore
                const tokenAmount = accountInfo.tokenAmount;
                const held = (_a = tokenAmount.uiAmount) !== null && _a !== void 0 ? _a : 0;
                return cap_table_entry_1.CapTableEntry.with({
                    holder: owner,
                    tokensHeld: held,
                    percentHeld: held / issued
                });
            });
            // filter our captable entries whose holdings are 0
            entries = (0, underscore_1.filter)(entries, entry => {
                return entry.tokensHeld > 0;
            });
            return cap_table_1.CapTable.with({
                entries,
                authorizedSupply,
                reservedSupply
            });
        });
    }
}
exports.CapTableService = CapTableService;
