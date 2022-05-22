"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIdentityVerificationServiceWith = exports.version = void 0;
const identity_verification_service_1 = require("./services/identity-verification-service");
exports.version = "0.2.0";
function createIdentityVerificationServiceWith(connection, programId) {
    return new identity_verification_service_1.IdentityVerificationService(connection, programId);
}
exports.createIdentityVerificationServiceWith = createIdentityVerificationServiceWith;
