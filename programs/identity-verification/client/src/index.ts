import {IdentityVerificationService} from "./services/identity-verification-service";
import {Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {IdentityRecord} from "./models/identity-record";

/**
 * Creates and identity verification record
 * @param connection Connection to use for rpc calls
 * @param programId On-chain identity verification program id
 * @param signer The signer of the transaction and of whom the record will be created.
 * @param group The public key of the group this record belongs to.
 * @param authority The public key of the account who will have write access to the record.
 */
export async function createIdentityRecordInstruction(
    connection: Connection,
    programId: PublicKey,
    signer: PublicKey,
    group: PublicKey,
    authority: PublicKey,
): Promise<TransactionInstruction> {

    const service = new IdentityVerificationService(connection, programId);
    return service.createRecordInstruction(signer, group, authority);

}

/**
 * Retrieves an identity verification record
 * @param connection Connection to use for rpc calls
 * @param programId On-chain identity verification program id
 * @param user The user of whom the record is about.
 * @param group The public key of the group this record belongs to.
 */
export async function getIdentityVerificationRecord(
    connection: Connection,
    programId: PublicKey,
    user: PublicKey,
    group: PublicKey,
): Promise<IdentityRecord> {

    const service = new IdentityVerificationService(connection, programId);
    return service.getRecord(user, group)

}