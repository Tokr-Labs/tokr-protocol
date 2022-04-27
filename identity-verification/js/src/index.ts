import {AccountMeta, PublicKey, SystemProgram, TransactionInstruction} from "@solana/web3.js";

/**
 * Creates a record instruction given the arguments
 * @param signer {PublicKey} The signer of the transaction
 * @param group {PublicKey} The group identifier used in determining the PDA
 * @param authority {PublicKey} The public key over the account that has update authority
 */
export const createRecordInstruction = async(signer: PublicKey, group: PublicKey, authority: PublicKey) => {

    const programId = new PublicKey("BijwizXGRMaAu9dYotXhavQpvjKgyDbxGFben4kozDue");
    const systemProgramId = SystemProgram.programId;

    const [record, bump] = await PublicKey.findProgramAddress(
        [
            signer.toBuffer(),
            group.toBuffer()
        ],
        programId
    );

    const keys: AccountMeta[] = [
        { pubkey: signer, isWritable: true, isSigner: true },
        { pubkey: record, isWritable: true, isSigner: false },
        { pubkey: systemProgramId, isWritable: false, isSigner: false },
        { pubkey: authority, isWritable: false, isSigner: false }
    ]

    return new TransactionInstruction({
        programId: programId,
        data: undefined,
        keys: keys
    })

}