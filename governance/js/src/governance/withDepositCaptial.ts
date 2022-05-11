import {LAMPORTS_PER_SOL, PublicKey, TransactionInstruction} from '@solana/web3.js';
import BN from 'bn.js';
import {DepositCapitalArgs} from "./instructions";
import {serialize} from 'borsh';
import {ASSOCIATED_TOKEN_PROGRAM_ID, SYSTEM_PROGRAM_ID, TOKEN_PROGRAM_ID} from "../tools";
import {getGovernanceSchema} from "./serialisation";

export const withDepositCapital = async (
    instructions: TransactionInstruction[],
    programId: PublicKey,
    realm: PublicKey,
    governance: PublicKey,
    authority: PublicKey,
    tokenAccount: PublicKey,
    tokenMint: PublicKey,
    amount: number,
) => {

    // instructions.push(ata transaction instruction)

    // @TODO: Need to figure out how to normalize the decimals of USDC to SOL
    //      or if i need to at all :shrug:
    const args = new DepositCapitalArgs({amount: new BN(amount * LAMPORTS_PER_SOL)});

    const data = Buffer.from(
        serialize(getGovernanceSchema(2), args),
    );

    const [vaultPublicKey] = await PublicKey.findProgramAddress(
        [
            governance.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            tokenMint.toBuffer()
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    )

    const keys = [
        { pubkey: realm, isWritable: false, isSigner: false }, // 0
        { pubkey: governance, isWritable: false, isSigner: false }, // 1
        { pubkey: authority, isWritable: true, isSigner: true }, // 2
        { pubkey: tokenAccount, isWritable: true, isSigner: false }, // 3
        { pubkey: vaultPublicKey, isWritable: true, isSigner: false }, // 4
        { pubkey: tokenMint, isWritable: false, isSigner: false }, // 5
        { pubkey: TOKEN_PROGRAM_ID, isWritable: false, isSigner: false }, // 6
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isWritable: false, isSigner: false }, // 7
        { pubkey: SYSTEM_PROGRAM_ID, isWritable: false, isSigner: false }, // 8
    ];

    instructions.push(
        new TransactionInstruction({
            keys,
            programId,
            data,
        })
    );

};
