import {CapTableEntry} from "./cap-table-entry";
import {PublicKey} from "@solana/web3.js";

export interface CapTableParams {
    entries: CapTableEntry[]
    /// total minted tokens, held by both users and the treasury stock account
    authorizedSupply: number
    /// Amount held in the treasury stock account (could potentially be "issued" later)
    reservedSupply: number
}


export class CapTable {

    // ============================================================
    // === Public Static API ======================================
    // ============================================================

    // Public Static Methods

    static with(info: CapTableParams): CapTable {
        return new CapTable(
            info.entries,
            info.authorizedSupply,
            info.reservedSupply,
        );
    }

    // ============================================================
    // === Public API =============================================
    // ============================================================

    // Public Properties

    readonly entries: CapTableEntry[];

    /// Amount held in the treasury stock account (could potentially be "issued" later)
    readonly reservedSupply: number;

    /// total minted tokens, held by both users and the treasury stock account
    readonly authorizedSupply: number

    // authorizedSupply less reservedSupply
    get outstandingSupply(): number {
        return this.authorizedSupply - this.reservedSupply
    }

    get formattedOutstandingSupply(): string {
        return (this.authorizedSupply - this.reservedSupply).toLocaleString()
    }

    get formatedReservedSupply(): string {
        return this.reservedSupply.toLocaleString()
    }

    get formatedAuthorizedSupply(): string {
        return this.authorizedSupply.toLocaleString()
    }

    // Public Methods

    constructor(entries: CapTableEntry[], authorizedSupply: number, reservedSupply: number) {
        this.entries = entries
        this.authorizedSupply = authorizedSupply
        this.reservedSupply = reservedSupply
    }

    /**
     * Converts the captable instance to JSON
     */
    toJSON() {
        return {
            "reservedSupply": this.reservedSupply,
            "authorizedSupply": this.authorizedSupply,
            "outstandingSupply": this.outstandingSupply ,
            "entries": this.entries.map(entry => {
                return {
                    "holder": entry.holder,
                    "tokensHeld": entry.tokensHeld,
                    "percentHeld": entry.percentHeld
                }
            })
        }
    }

}
