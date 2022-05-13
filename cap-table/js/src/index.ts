import {Connection, PublicKey} from "@solana/web3.js";
import {CapTableService} from "./services/cap-table-service";
import {CapTable} from "./models/cap-table";

/**
 * Determine the cap table for the given spl token mint
 * @param connection
 * @param mint Spl token mint
 * @param treasuryStockAccount Account that holds non-issued tokens for the mint
 * @param excludedAccounts Array of public keys to exclude from the calculation of the cap table
 */
export async function determineCapTableForToken(
    connection: Connection,
    mint: PublicKey,
    treasuryStockAccount: PublicKey,
    excludedAccounts: PublicKey[] | null
): Promise<CapTable> {

    const capTableService = new CapTableService(connection);

    return capTableService.getCapTableForMint(
        mint,
        treasuryStockAccount,
        excludedAccounts ?? []
    );

}