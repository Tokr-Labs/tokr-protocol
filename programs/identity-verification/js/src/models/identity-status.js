"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityStatus = void 0;
/**
 * Statuses associated with kyc, aml and accreditation
 */
var IdentityStatus;
(function (IdentityStatus) {
    IdentityStatus[IdentityStatus["initial"] = 0] = "initial";
    IdentityStatus[IdentityStatus["started"] = 1] = "started";
    IdentityStatus[IdentityStatus["approved"] = 2] = "approved";
    IdentityStatus[IdentityStatus["denied"] = 3] = "denied";
})(IdentityStatus = exports.IdentityStatus || (exports.IdentityStatus = {}));
