import {PublicKey} from "@solana/web3.js";
import {IdentityStatus} from "./identity-status";

export type BumpSeed = number

export class IdentityRecord {

    // ============================================================
    // === Public Static API ======================================
    // ============================================================

    /**
     * Factory method that takes json and produces an identity record instance
     * @param info
     * @param address
     */
    static with(info: any, address: PublicKey): IdentityRecord {

        return new IdentityRecord(
            info.bump,
            info.iaStatus as IdentityStatus,
            info.amlStatus as IdentityStatus,
            info.kycStatus as IdentityStatus,
            info.authority,
            address
        )

    }

    // ============================================================
    // === Public API =============================================
    // ============================================================

    // Public Properties

    /// bump seed used in deriving the pda for the status account
    readonly bump: BumpSeed

    // Accreditation status of the user
    readonly iaStatus: IdentityStatus

    /// AML status of the user
    readonly amlStatus: IdentityStatus

    /// KYC status of the user
    readonly kycStatus: IdentityStatus

    /// Account who has update authority over the account
    readonly authority: PublicKey

    /// Address of the record
    readonly address: PublicKey

    get isVerified(): boolean {
        return this.amlStatus == IdentityStatus.approved &&
            this.iaStatus == IdentityStatus.approved &&
            this.kycStatus == IdentityStatus.approved
    }

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
    private constructor(
        bump: BumpSeed,
        iaStatus: IdentityStatus,
        amlStatus: IdentityStatus,
        kycStatus: IdentityStatus,
        authority: PublicKey,
        address: PublicKey
    ) {
        this.bump = bump
        this.iaStatus = iaStatus
        this.amlStatus = amlStatus
        this.kycStatus = kycStatus
        this.authority = authority
        this.address = address;
    }

}