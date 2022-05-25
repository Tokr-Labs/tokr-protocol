import {IdentityVerificationService} from "./services/identity-verification-service";
import {Connection, PublicKey} from "@solana/web3.js";

/**
 * Main entry point for the idv client library
 * @param connection Connection being used by client or cli
 * @param programId Optional id for the on-chain idv program
 */
export function createIdentityVerificationServiceWith(connection: Connection, programId: PublicKey): IdentityVerificationService {
    return new IdentityVerificationService(connection, programId);
}