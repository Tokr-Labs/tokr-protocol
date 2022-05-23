"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityRecord = void 0;
const identity_status_1 = require("./identity-status");
class IdentityRecord {
    // ============================================================
    // === Private API ============================================
    // ============================================================
    // Private Methods
    /**
     * @param bump
     * @param iaStatus
     * @param amlStatus
     * @param kycStatus
     * @param authority
     * @param address
     */
    constructor(bump, iaStatus, amlStatus, kycStatus, authority, address) {
        this.bump = bump;
        this.iaStatus = iaStatus;
        this.amlStatus = amlStatus;
        this.kycStatus = kycStatus;
        this.authority = authority;
        this.address = address;
    }
    // ============================================================
    // === Public Static API ======================================
    // ============================================================
    /**
     * Factory method that takes json and produces an identity record instance
     * @param info
     * @param address
     */
    static with(info, address) {
        return new IdentityRecord(info.bump, info.iaStatus, info.amlStatus, info.kycStatus, info.authority, address);
    }
    get isVerified() {
        return this.amlStatus == identity_status_1.IdentityStatus.approved &&
            this.iaStatus == identity_status_1.IdentityStatus.approved &&
            this.kycStatus == identity_status_1.IdentityStatus.approved;
    }
}
exports.IdentityRecord = IdentityRecord;
