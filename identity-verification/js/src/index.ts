import {Program} from "@project-serum/anchor"
import {IdentityVerification, IDL} from "./idl/identity_verification";
import {AccountMeta, PublicKey, TransactionInstruction, SystemProgram} from "@solana/web3.js";

/**
 * Creates a record instruction given the arguments
 * @param signer {PublicKey} The signer of the transaction
 * @param group {PublicKey} The group identifier used in determining the PDA
 * @param authority {PublicKey} The public key over the account that has update authority
 */
export const createRecordInstruction = async(signer: PublicKey, group: PublicKey, authority: PublicKey) => {

    const idl = require("./idl/identity_verification.json");
    const program = new Program<IdentityVerification>(IDL, idl.metadata.address)
    const systemProgramId = SystemProgram.programId;

    const record: PublicKey = PublicKey.findProgramAddressSync(
        [
            signer.toBuffer(),
            group.toBuffer()
        ],
        program.programId
    )[0];

    const keys: AccountMeta[] = [
        { pubkey: signer, isWritable: true, isSigner: true },
        { pubkey: record, isWritable: true, isSigner: false },
        { pubkey: systemProgramId, isWritable: false, isSigner: false },
        { pubkey: authority, isWritable: false, isSigner: false }
    ]

    return new TransactionInstruction({
        programId: program.programId,
        data: undefined,
        keys: keys
    })

}