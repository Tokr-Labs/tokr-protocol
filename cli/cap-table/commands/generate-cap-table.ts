import {PublicKey, Connection} from "@solana/web3.js";
import process from "process";
import {determineCapTableForToken} from "../../../programs/cap-table/js/src/index";
import * as fs from "fs";

export async function generateCapTable(options: any) {

    const endpoint = options.endpoint;
    const mintAddress = new PublicKey(options.mint);
    const treasuryStockAccount = new PublicKey(options.treasuryStockAccount);

    let excludedAccounts = [];

    if (options.excludedAccounts !== "") {
        excludedAccounts = options.excludedAccounts.split(",").map((excludedAccount: string) => new PublicKey(excludedAccount));
    }

    const connection = new Connection(endpoint)

    const capTable = await determineCapTableForToken(
        connection,
        mintAddress,
        treasuryStockAccount,
        excludedAccounts
    )

    if (!options.output) {
        console.log(capTable.toJSON())
    } else {
        fs.writeFileSync(options.output,JSON.stringify(capTable.toJSON()))
    }

    process.exit(1);

}