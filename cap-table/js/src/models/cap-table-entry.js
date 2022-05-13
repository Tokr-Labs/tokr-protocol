"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapTableEntry = void 0;
class CapTableEntry {
    // Public Methods
    constructor(holder, tokensHeld, percentHeld) {
        this.holder = holder;
        this.tokensHeld = tokensHeld;
        this.percentHeld = percentHeld;
    }
    // ============================================================
    // === Public Static API ======================================
    // ============================================================
    // Public Static Methods
    static with(info) {
        return new CapTableEntry(info.holder, info.tokensHeld, info.percentHeld);
    }
    get formattedPercentage() {
        const formatted = (this.percentHeld * 100).toFixed(4);
        return `${formatted}%`;
    }
}
exports.CapTableEntry = CapTableEntry;
