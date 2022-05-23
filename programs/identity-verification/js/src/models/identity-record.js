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
     * The constructor is private, the static factory method should be used
     * @param bump Bump for the PDA
     * @param iaStatus Investor accreditation status
     * @param amlStatus AML status
     * @param kycStatus KYC status
     * @param authority Account that has the authority to update the idv record
     * @param address Address of the account the record is about
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
     * @param info data returned from the on-chain idv program
     * @param address Account address the record is about
     */
    static with(info, address) {
        return new IdentityRecord(info.bump, info.iaStatus, info.amlStatus, info.kycStatus, info.authority, address);
    }
    /// derived property that checks that all statuses are approved
    get isVerified() {
        return this.amlStatus == identity_status_1.IdentityStatus.approved &&
            this.iaStatus == identity_status_1.IdentityStatus.approved &&
            this.kycStatus == identity_status_1.IdentityStatus.approved;
    }
}
exports.IdentityRecord = IdentityRecord;
