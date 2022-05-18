import {IdentityVerificationService} from "./services/identity-verification-service";
import {Connection, PublicKey} from "@solana/web3.js";

export const version = () => {
    return "0.2.0"
}

export const service = (connection:Connection, programId?:PublicKey) => {
    return new IdentityVerificationService(connection, programId)
}