"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapTableEntry = void 0;
class CapTableEntry {
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
    constructor(holder, tokensHeld, percentHeld) {
        this.holder = holder;
        this.tokensHeld = tokensHeld;
        this.percentHeld = percentHeld;
    }
    // ============================================================
    // === Public Static API ======================================
    // ============================================================
    // Public Static Methods
    /**
     * Static factory method for creating cap table entries
     * @param info cap table entry data
     */
    static with(info) {
        return new CapTableEntry(info.holder, info.tokensHeld, info.percentHeld);
    }
    /// Formatted display value of percentage of tokens held
    get formattedPercentage() {
        const formatted = (this.percentHeld * 100).toFixed(4);
        return `${formatted}%`;
    }
}
exports.CapTableEntry = CapTableEntry;
