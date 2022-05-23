"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapTable = void 0;
class CapTable {
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
    constructor(entries, authorizedSupply, reservedSupply) {
        this.entries = entries;
        this.authorizedSupply = authorizedSupply;
        this.reservedSupply = reservedSupply;
    }
    // ============================================================
    // === Public Static API ======================================
    // ============================================================
    // Public Static Methods
    /**
     * Factory method for generating a cap table instance
     * @param info Info about the cap table
     */
    static with(info) {
        return new CapTable(info.entries, info.authorizedSupply, info.reservedSupply);
    }
    // authorizedSupply less reservedSupply
    get outstandingSupply() {
        return this.authorizedSupply - this.reservedSupply;
    }
    /// formatted display version of the outstanding supply
    get formattedOutstandingSupply() {
        return (this.authorizedSupply - this.reservedSupply).toLocaleString();
    }
    /// formatted display version of the reserved supply
    get formattedReservedSupply() {
        return this.reservedSupply.toLocaleString();
    }
    /// formatted display version of the authorized supply
    get formattedAuthorizedSupply() {
        return this.authorizedSupply.toLocaleString();
    }
    // Public Methods
    /**
     * Converts the captable instance to JSON. Useful if needing a snapshot in time of the cap-table. Can be run through the CLI.
     */
    toJSON() {
        return {
            "reservedSupply": this.reservedSupply,
            "authorizedSupply": this.authorizedSupply,
            "outstandingSupply": this.outstandingSupply,
            "entries": this.entries.map(entry => {
                return {
                    "holder": entry.holder,
                    "tokensHeld": entry.tokensHeld,
                    "percentHeld": entry.percentHeld
                };
            })
        };
    }
}
exports.CapTable = CapTable;
