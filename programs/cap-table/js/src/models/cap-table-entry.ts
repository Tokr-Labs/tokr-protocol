import {PublicKey} from "@solana/web3.js";

export interface CapTableEntryParams {
    /// The holder of the spl token
    holder: PublicKey,
    /// The total tokens held
    tokensHeld: number,
    /// Formatted display value of percentage of tokens held
    percentHeld: number
}

export class CapTableEntry {

    // ============================================================
    // === Public Static API ======================================
    // ============================================================

    // Public Static Methods

    /**
     * Static factory method for creating cap table entries
     * @param info cap table entry data
     */
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

    /// The holder of the spl token
    readonly holder: PublicKey

    /// The total tokens held
    readonly tokensHeld: number

    /// The percentage of the total number of tokens / tokens held
    readonly percentHeld: number

    /// Formatted display value of percentage of tokens held
    get formattedPercentage(): string {
        const formatted = (this.percentHeld * 100).toFixed(4)
        return `${formatted}%`
    }

    // ============================================================
    // === Private API ============================================
    // ============================================================

    // Private Methods

    /**
     * private constructor, should use facotry method for instance creation
     * @param holder The holder of the spl token
     * @param tokensHeld The total tokens held
     * @param percentHeld The percentage of the total number of tokens / tokens held
     * @private
     */
    private constructor(
        holder: PublicKey,
        tokensHeld: number,
        percentHeld: number
    ) {
        this.holder = holder
        this.tokensHeld = tokensHeld
        this.percentHeld = percentHeld
    }

}