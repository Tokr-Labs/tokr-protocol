"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityStatus = void 0;
/**
 * Statuses associated with kyc, aml and accreditation
 */
var IdentityStatus;
(function (IdentityStatus) {
    /// account has been created, but the status has not been updated yet
    IdentityStatus[IdentityStatus["initial"] = 0] = "initial";
    /// the vendors have started to process the identity of the account
    IdentityStatus[IdentityStatus["started"] = 1] = "started";
    /// the user has passed identity verification for the related piece of information (kyc, aml, accreditation)
    IdentityStatus[IdentityStatus["approved"] = 2] = "approved";
    /// the user has failed identity verification for the related piece of information (kyc, aml, accreditation)
    IdentityStatus[IdentityStatus["denied"] = 3] = "denied";
})(IdentityStatus = exports.IdentityStatus || (exports.IdentityStatus = {}));
