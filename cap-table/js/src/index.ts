import {Connection, PublicKey} from "@solana/web3.js";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {CapTableService} from "./cap-table-service";
import {CapTable} from "./cap-table";

export async function determineCapTableForToken(connection: Connection, mint: PublicKey, excludedAccount: PublicKey[] | null): Promise<CapTable> {

    const capTableService = new CapTableService(connection);
    return capTableService.getCapTableForMint(mint);

}