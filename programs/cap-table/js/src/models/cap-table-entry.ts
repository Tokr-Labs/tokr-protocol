import {PublicKey} from "@solana/web3.js";

export interface CapTableEntryParams {
    holder: PublicKey,
    tokensHeld: number,
    percentHeld: number
}

export class CapTableEntry {

    // ============================================================
    // === Public Static API ======================================
    // ============================================================

    // Public Static Methods

    static with(info: CapTableEntryParams): CapTableEntry {
        return new CapTableEntry(
            info.holder,
            info.tokensHeld,
            info.percentHeld
        )
    }

    // ============================================================
    // === Public API =============================================
    // ============================================================

    // Public Properties

    readonly holder: PublicKey
    readonly tokensHeld: number
    readonly percentHeld: number

    get formattedPercentage(): string {
        const formatted = (this.percentHeld * 100).toFixed(4)
        return `${formatted}%`
    }

    // Public Methods

    constructor(holder: PublicKey, tokensHeld: number, percentHeld: number) {
        this.holder = holder
        this.tokensHeld = tokensHeld
        this.percentHeld = percentHeld
    }

}