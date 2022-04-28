import {Connection, PublicKey, SystemProgram} from "@solana/web3.js";
import {Program} from '@project-serum/anchor';
import {IdentityVerification, IDL} from "./identity_verification";

/**
 * Create Record Instruction
 * @param signer
 * @param group
 * @param authority
 */
export const createRecordInstruction = async (
    connection: Connection,
    signer: PublicKey,
    group: PublicKey,
    authority: PublicKey
) => {

    const programId = new PublicKey("BijwizXGRMaAu9dYotXhavQpvjKgyDbxGFben4kozDue");
    const program = new Program<IdentityVerification>(IDL, programId, {
        connection: connection
    });

    const [record, bump] = await PublicKey.findProgramAddress(
        [
            group.toBuffer(),
            signer.toBuffer(),
        ],
        programId
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
