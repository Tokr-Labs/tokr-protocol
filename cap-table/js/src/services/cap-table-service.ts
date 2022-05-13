import {Connection, PublicKey, TokenAmount} from "@solana/web3.js";
import {Account, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {CapTable} from "../models/cap-table";
import {contains, filter} from "underscore";
import {CapTableEntry} from "../models/cap-table-entry";

export class CapTableService {

    // ============================================================
    // === Internal API ===========================================
    // ============================================================

    /**
     * Constructor
     * @param connection
     */
    constructor(private connection: Connection) {
    }

    /**
     * Retrieves the cap table for the given mint excluding certain accounts
     * @param mintAddress Spl token mint address
     * @param treasuryStockAccount Account that holds non-issued tokens for the mint
     * @param excludedAccounts Array of account to exclude
     */
    async getCapTableForMint(
        mintAddress: PublicKey,
        treasuryStockAccount: PublicKey,
        excludedAccounts: PublicKey[]
    ): Promise<CapTable> {

        const config = {
            filters: [{
                memcmp: {
                    offset: 0,
                    bytes: mintAddress.toBase58()
                }
            }]
        };

        // account holding tokens of the provided mint
        let accounts = await this.connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, config)

        // total spl tokens minted
        const mintSupply = await this.connection.getTokenSupply(mintAddress);

        // original holder of all minted spl tokens
        let treasuryStockAccountInfo = await this.connection.getTokenAccountBalance(treasuryStockAccount);

        // total minted supply of spl tokens for the provided mint
        const supply = mintSupply.value.uiAmount ?? 0

        // number of spl tokens that have not been issued
        const outstanding = treasuryStockAccountInfo.value.uiAmount ?? 0;

        // inverse of outstanding, total of spl tokens that have been issued
        const issued = supply - outstanding;

        // filter out excluded accounts

        accounts = filter(accounts, account => {
            // @ts-ignore
            const owner = account.account.data.parsed.info.owner;
            return !contains(excludedAccounts.map(excludedAccount => excludedAccount.toBase58()), owner)
        });

        // generate cap table entries for the accounts returned

        let entries: CapTableEntry[] = accounts.map(account => {

            // @ts-ignore
            const parsed = account.account.data.parsed;
            const accountInfo: Account = parsed.info;
            const owner = accountInfo.owner;

            // @ts-ignore
            const tokenAmount: TokenAmount = accountInfo.tokenAmount;

            const held = tokenAmount.uiAmount ?? 0;

            return CapTableEntry.with({
                holder: owner,
                tokensHeld: held,
                percentHeld: held / issued
            })

        })

        // filter our captable entries whose holdings are 0

        entries = filter(entries, entry => {
            return entry.tokensHeld > 0
        })

        return CapTable.with({
            entries,
            supply,
            outstanding
        })

    }

}