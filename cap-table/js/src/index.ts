import {Connection, PublicKey} from "@solana/web3.js";
import {CapTableService} from "./services/cap-table-service";
import {CapTable} from "./models/cap-table";

/**
 * Determine the cap table for the given spl token mint
 * @param connection {Connection}
 * @param mint {PublicKey} Spl token mint
 * @param excludedAccounts {PublicKey[]} Array of public keys to exclude from the calculation of the cap table
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