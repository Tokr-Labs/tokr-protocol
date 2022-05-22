import {IdentityVerificationService} from "./services/identity-verification-service";
import {Connection, PublicKey} from "@solana/web3.js";

export const version = "0.2.0"
export function createIdentityVerificationServiceWith(connection: Connection, programId: PublicKey): IdentityVerificationService {
    return new IdentityVerificationService(connection, programId);
}