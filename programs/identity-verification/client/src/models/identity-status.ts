
export enum IdentityStatusType {
    aml,
    ia,
    kyc
}

/**
 * Statuses associated with kyc, aml and accreditation
 */
export enum IdentityStatus {
    /// account has been created, but the status has not been updated yet
    initial,
    /// the vendors have started to process the identity of the account
    started,
    /// the user has passed identity verification for the related piece of information (kyc, aml, accreditation)
    approved,
    /// the user has failed identity verification for the related piece of information (kyc, aml, accreditation)
    denied
}