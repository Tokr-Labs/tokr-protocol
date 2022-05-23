import {CapTableEntry} from "./cap-table-entry";
import {PublicKey} from "@solana/web3.js";

export interface CapTableParams {
    /// array of cap table entries
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

    /**
     * Factory method for generating a cap table instance
     * @param info Info about the cap table
     */
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

    /// array of cap table entries
    readonly entries: CapTableEntry[];

    /// Amount held in the treasury stock account (could potentially be "issued" later)
    readonly reservedSupply: number;

    /// total minted tokens, held by both users and the treasury stock account
    readonly authorizedSupply: number

    // authorizedSupply less reservedSupply
    get outstandingSupply(): number {
        return this.authorizedSupply - this.reservedSupply
    }

    /// formatted display version of the outstanding supply
    get formattedOutstandingSupply(): string {
        return (this.authorizedSupply - this.reservedSupply).toLocaleString()
    }

    /// formatted display version of the reserved supply
    get formattedReservedSupply(): string {
        return this.reservedSupply.toLocaleString()
    }

    /// formatted display version of the authorized supply
    get formattedAuthorizedSupply(): string {
        return this.authorizedSupply.toLocaleString()
    }

    // Public Methods

    /**
     * Converts the captable instance to JSON. Useful if needing a snapshot in time of the cap-table. Can be run through the CLI.
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

    // ============================================================
    // === Private API ============================================
    // ============================================================

    // Private Properties

    /**
     * private constructor should use factory method for instance creation
     * @param entries array of cap table entries
     * @param authorizedSupply total spl tokens minted
     * @param reservedSupply amount held in the treasury stock account (could potentially be "issued" later)
     */
    constructor(
        entries: CapTableEntry[],
        authorizedSupply: number,
        reservedSupply: number
    ) {
        this.entries = entries
        this.authorizedSupply = authorizedSupply
        this.reservedSupply = reservedSupply
    }


}
