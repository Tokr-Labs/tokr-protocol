import {CapTableEntry} from "./cap-table-entry";
import {PublicKey} from "@solana/web3.js";

export interface CapTableParams {
    entries: CapTableEntry[],
    outstanding: number,
    supply: number
}


export class CapTable {

    // ============================================================
    // === Public Static API ======================================
    // ============================================================

    // Public Static Methods

    static with(info: CapTableParams): CapTable {
        return new CapTable(
            info.entries,
            info.outstanding,
            info.supply,
        );
    }

    // ============================================================
    // === Public API =============================================
    // ============================================================

    // Public Properties

    readonly entries: CapTableEntry[];
    readonly outstanding: number;
    readonly supply: number

    get formattedIssued(): string {
        return (this.supply - this.outstanding).toLocaleString()
    }

    get formattedOutstanding(): string {
        return this.outstanding.toLocaleString()
    }

    get formattedSupply(): string {
        return this.supply.toLocaleString()
    }

    // Public Methods

    constructor(entries: CapTableEntry[], outstanding: number, supply: number) {
        this.entries = entries
        this.outstanding = outstanding
        this.supply = supply
    }

}
