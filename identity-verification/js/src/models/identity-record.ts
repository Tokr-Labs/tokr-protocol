import {PublicKey} from "@solana/web3.js";
import {Status} from "./status";

export type BumpSeed = number

export class IdentityRecord {

    // ============================================================
    // === Public Static API ======================================
    // ============================================================

    /**
     * Factory method that takes json and produces an identity record instance
     * @param info
     */
    static with(info: any): IdentityRecord {

        return new IdentityRecord(
            info.bump,
            info.iaStatus,
            info.amlStatus,
            info.kycStatus,
            info.authority
        )

    }

    // ============================================================
    // === Public API =============================================
    // ============================================================

    // Public Properties

    /// bump seed used in deriving the pda for the status account
    bump: BumpSeed

    // Accreditation status of the user
    iaStatus: Status

    /// AML status of the user
    amlStatus: Status

    /// KYC status of the user
    kycStatus: Status

    /// Account who has update authority over the account
    authority: PublicKey

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
     */
    private constructor(
        bump: BumpSeed,
        iaStatus:Status,
        amlStatus: Status,
        kycStatus: Status,
        authority: PublicKey
    ) {
        this.bump = bump
        this.iaStatus = iaStatus
        this.amlStatus = amlStatus
        this.kycStatus = kycStatus
        this.authority = authority
    }

}