"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapTable = void 0;
class CapTable {
    // Public Methods
    constructor(entries, authorizedSupply, reservedSupply) {
        this.entries = entries;
        this.authorizedSupply = authorizedSupply;
        this.reservedSupply = reservedSupply;
    }
    // ============================================================
    // === Public Static API ======================================
    // ============================================================
    // Public Static Methods
    static with(info) {
        return new CapTable(info.entries, info.authorizedSupply, info.reservedSupply);
    }
    // authorizedSupply less reservedSupply
    get outstandingSupply() {
        return this.authorizedSupply - this.reservedSupply;
    }
    get formattedOutstandingSupply() {
        return (this.authorizedSupply - this.reservedSupply).toLocaleString();
    }
    get formatedReservedSupply() {
        return this.reservedSupply.toLocaleString();
    }
    get formatedAuthorizedSupply() {
        return this.authorizedSupply.toLocaleString();
    }
    /**
     * Converts the captable instance to JSON
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
