import {PublicKey} from "@solana/web3.js";
import {IdentityStatus} from "./identity-status";

export type BumpSeed = number

export interface IdentityRecordParams {
    bump: BumpSeed,
    iaStatus: IdentityStatus,
    amlStatus: IdentityStatus,
    kycStatus: IdentityStatus,
    authority: PublicKey
}

export class IdentityRecord {

    // ============================================================
    // === Public Static API ======================================
    // ============================================================

    /**
     * Factory method that takes json and produces an identity record instance
     * @param info data returned from the on-chain idv program
     * @param address Account address the record is about
     */
    static with(info: IdentityRecordParams, address: PublicKey): IdentityRecord {

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

    /// derived property that checks that all statuses are approved
    get isVerified(): boolean {
        return this.amlStatus == IdentityStatus.approved &&
            this.iaStatus == IdentityStatus.approved &&
            this.kycStatus == IdentityStatus.approved
    }

    /// get the combined status of aml, kyc and ia
    get status(): IdentityStatus {

        if (
            this.amlStatus === IdentityStatus.denied ||
            this.kycStatus === IdentityStatus.denied ||
            this.iaStatus === IdentityStatus.denied
        ) {

            return IdentityStatus.denied

        } else if (
            this.amlStatus === IdentityStatus.initial &&
            this.kycStatus === IdentityStatus.initial &&
            this.iaStatus === IdentityStatus.initial
        ) {

            return IdentityStatus.initial

        } else if (
            this.amlStatus === IdentityStatus.started ||
            this.kycStatus === IdentityStatus.started ||
            this.iaStatus === IdentityStatus.started
        ) {

            return IdentityStatus.started

        } else if (
            this.amlStatus === IdentityStatus.approved &&
            this.kycStatus === IdentityStatus.approved &&
            this.iaStatus === IdentityStatus.approved
        ) {

            return IdentityStatus.approved

        } else {

            return IdentityStatus.started

        }

    }

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