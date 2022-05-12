import {AccountInfo, Connection, ParsedAccountData, PublicKey, TokenAmount} from "@solana/web3.js";
import {Account, getMint, Mint, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {CapTable, CapTableEntry} from "./cap-table";

export class CapTableService {

    // ============================================================
    // === Internal API ===========================================
    // ============================================================

    constructor(private connection: Connection) {
    }

    async getCapTableForMint(mintAddress: PublicKey): Promise<CapTableEntry[]> {

        const mint = await getMint(this.connection, mintAddress);

        return await this.getTokenHoldersForMint(mint);

    }

    // ============================================================
    // === Private API ============================================
    // ============================================================

    private async getTokenHoldersForMint(mint: Mint): Promise<CapTableEntry[]> {

        const config = {
            filters: [{
                dataSize: 165
            }, {
                memcmp: {
                    offset: 0,
                    bytes: mint.address.toBase58()
                }
            }]
        };

        const accounts = await this.connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, config)
        const mintSupply = await this.connection.getTokenSupply(mint.address);

        let entries: CapTableEntry[] = accounts.map(account => {

            // @ts-ignore
            const parsed = account.account.data.parsed;
            const owner = account.account.owner;
            const accountInfo: Account = parsed.info;

            // @ts-ignore
            const tokenAmount: TokenAmount = accountInfo.tokenAmount;

            const held = tokenAmount.uiAmount ?? 0;
            const supply = mintSupply.value.uiAmount ?? 0;

            return {
                holderAddress: owner,
                commonEquivalent: held,
                tokensHeld: held,
                percentOwned: held / supply
            }

        })

        return entries;

    }

}