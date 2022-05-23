"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIdentityVerificationServiceWith = void 0;
const identity_verification_service_1 = require("./services/identity-verification-service");
/**
 * Main entry point for the idv client library
 * @param connection Connection being used by client or cli
 * @param programId Optional id for the on-chain idv program
 */
function createIdentityVerificationServiceWith(connection, programId) {
    return new identity_verification_service_1.IdentityVerificationService(connection, programId);
}
exports.createIdentityVerificationServiceWith = createIdentityVerificationServiceWith;
