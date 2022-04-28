import {Connection, Keypair, PublicKey, SystemProgram} from "@solana/web3.js";
import {Program} from '@project-serum/anchor';
import {IdentityVerification, IDL} from "./identity_verification";

const getProgramId = (connection: Connection) => {

    if (connection.rpcEndpoint.search(/dev/gi)) {
        return new PublicKey("5WJNeGKQQJMaTCPgtXhmsiEK4bA6dLT94smLFmTU8Gh9")
    } else {
        return new PublicKey("idv2F375xYuz2K7a7LxcrkhgWbPsJgpuWD3XLW1AFdD")
    }

}

/**
 * Statuses associated with kyc, aml and accreditation
 */
export enum Status {
    initial,
    started,
    approved,
    denied
}

/**
 * Creates and identity verification record
 * @param connection
 * @param programId The PublicKey of the on-chain identity verification program.
 * @param signer The signer of the transaction and of whom the record will be created.
 * @param group The public key of the group this record belongs to.
 * @param authority The public key of the account who will have write access to the record.
 */
export const createRecordInstruction = async (
    connection: Connection,
    signer: PublicKey,
    group: PublicKey,
    authority: PublicKey,
    programId?: PublicKey
) => {

    const _programId = programId ?? getProgramId(connection);

    const program = new Program<IdentityVerification>(
        IDL,
        _programId,
        {
            connection: connection
        }
    );

    const [record, bump] = await PublicKey.findProgramAddress(
        [
            group.toBuffer(),
            signer.toBuffer(),
        ],
        _programId
    );

    let txi = program.instruction.createRecord(bump, group, {
        accounts: {
            signer: signer,
            record: record,
            systemProgram: SystemProgram.programId,
            authority: authority
        },
    });

    return txi

}

/**
 * Retrieves a identity verification record
 * @param connection
 * @param programId The PublicKey of the on-chain identity verification program.
 * @param user The user of whom the record is about.
 * @param group The public key of the group this record belongs to.
 */
export const getRecord = async (
    connection: Connection,
    user: PublicKey,
    group: PublicKey,
    programId?: PublicKey
) => {

    const _programId = programId ?? getProgramId(connection);

    const program = new Program<IdentityVerification>(IDL, _programId, {
        connection: connection
    });

    const [record, bump] = await PublicKey.findProgramAddress(
        [
            group.toBuffer(),
            user.toBuffer(),
        ],
        _programId
    );

    return await program.account.metadata.fetch(record);

}

/**
 * Updates the investor accreditation status for the record
 * @param connection
 * @param programId The PublicKey of the on-chain identity verification program.
 * @param user The user of whom the record is about.
 * @param group The public key of the group this record belongs to.
 * @param signer The authority over the record that will also sign the transaction
 * @param status investor accreditation status
 */
export const updateIaStatus = async (
    connection: Connection,
    user: PublicKey,
    group: PublicKey,
    signer: Keypair,
    status: Status,
    programId?: PublicKey
) => {

    if ((typeof window !== "undefined" && !window.process?.hasOwnProperty("type"))) {
        throw new Error("This method is not supported in the browser")
    }

    const _programId = programId ?? getProgramId(connection);

    const program = new Program<IdentityVerification>(IDL, _programId, {
        connection: connection
    });

    const [record, bump] = await PublicKey.findProgramAddress(
        [
            group.toBuffer(),
            user.toBuffer(),
        ],
        _programId
    );

    const tx = await program.rpc.updateIaStatus(bump, group, status, {
        accounts: {
            record: record,
            subject: user,
            authority: signer.publicKey
        },
        signers: [signer],
    });

    return tx

}

/**
 * Updates the investor accreditation status for the record
 * @param connection
 * @param programId The PublicKey of the on-chain identity verification program.
 * @param user The user of whom the record is about.
 * @param group The public key of the group this record belongs to.
 * @param signer The authority over the record that will also sign the transaction
 * @param status kyc status
 */
export const updateKycStatus = async (
    connection: Connection,
    user: PublicKey,
    group: PublicKey,
    signer: Keypair,
    status: Status,
    programId?: PublicKey
) => {

    if ((typeof window !== "undefined" && !window.process?.hasOwnProperty("type"))) {
        throw new Error("This method is not supported in the browser")
    }

    const _programId = programId ?? getProgramId(connection);

    const program = new Program<IdentityVerification>(IDL, _programId, {
        connection: connection
    });

    const [record, bump] = await PublicKey.findProgramAddress(
        [
            group.toBuffer(),
            user.toBuffer(),
        ],
        _programId
    );

    const tx = await program.rpc.updateKycStatus(bump, group, status, {
        accounts: {
            record: record,
            subject: user,
            authority: signer.publicKey
        },
        signers: [signer],
    });

    return tx

}

/**
 * Updates the investor accreditation status for the record
 * @param connection
 * @param programId The PublicKey of the on-chain identity verification program.
 * @param user The user of whom the record is about.
 * @param group The public key of the group this record belongs to.
 * @param signer The authority over the record that will also sign the transaction
 * @param status aml status
 */
export const updateAmlStatus = async (
    connection: Connection,
    user: PublicKey,
    group: PublicKey,
    signer: Keypair,
    status: Status,
    programId?: PublicKey
) => {

    if ((typeof window !== "undefined" && !window.process?.hasOwnProperty("type"))) {
        throw new Error("This method is not supported in the browser")
    }

    const _programId = programId ?? getProgramId(connection);

    const program = new Program<IdentityVerification>(IDL, _programId, {
        connection: connection
    });

    const [record, bump] = await PublicKey.findProgramAddress(
        [
            group.toBuffer(),
            user.toBuffer(),
        ],
        _programId
    );

    const tx = await program.rpc.updateAmlStatus(bump, group, status, {
        accounts: {
            record: record,
            subject: user,
            authority: signer.publicKey
        },
        signers: [signer],
    });

    return tx

}

/**
 *
 * @param connection
 * @param programId The PublicKey of the on-chain identity verification program.
 * @param user The user of whom the record is about.
 * @param group The public key of the group this record belongs to.
 * @param currentAuthority The public key of the account that currently has update authority.
 * @param newAuthority The public key that update authority will be given to.
 */
export const transferAuthority = async (
    connection: Connection,
    user: PublicKey,
    group: PublicKey,
    currentAuthority: Keypair,
    newAuthority: PublicKey,
    programId?: PublicKey
) => {

    if ((typeof window !== "undefined" && !window.process?.hasOwnProperty("type"))) {
        throw new Error("This method is not supported in the browser")
    }

    const _programId = programId ?? getProgramId(connection);

    const program = new Program<IdentityVerification>(IDL, _programId, {
        connection: connection
    });

    const [record, bump] = await PublicKey.findProgramAddress(
        [
            group.toBuffer(),
            user.toBuffer(),
        ],
        _programId
    );

    const tx = await program.rpc.transferAuthority(bump, group, {
        accounts: {
            record: record,
            subject: user,
            transferTo: currentAuthority.publicKey,
            transferFrom: newAuthority
        },
        signers: [currentAuthority],
    });

    return tx

}