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
exports.determineCapTableForToken = void 0;
const cap_table_service_1 = require("./services/cap-table-service");
/**
 * Determine the cap table for the given spl token mint
 * @param connection
 * @param mint Spl token mint
 * @param treasuryStockAccount Account that holds non-issued tokens for the mint
 * @param excludedAccounts Array of public keys to exclude from the calculation of the cap table
 */
function determineCapTableForToken(connection, mint, treasuryStockAccount, excludedAccounts) {
    return __awaiter(this, void 0, void 0, function* () {
        const capTableService = new cap_table_service_1.CapTableService(connection);
        return capTableService.getCapTableForMint(mint, treasuryStockAccount, excludedAccounts !== null && excludedAccounts !== void 0 ? excludedAccounts : []);
    });
}
exports.determineCapTableForToken = determineCapTableForToken;
