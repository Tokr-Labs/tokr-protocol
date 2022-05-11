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
    capitalGovernance: PublicKey,
    lpGovernance: PublicKey,
    lpGovernedAccount: PublicKey,
    capitalTokenAuthority: PublicKey,
    capitalTokenAccount: PublicKey,
    capitalTokenMint: PublicKey,
    lpTokenAccount: PublicKey,
    lpTokenMint: PublicKey,
    amount: number,
) => {

    // @TODO: Need to figure out how to normalize the decimals of USDC to SOL
    //      or if i need to at all :shrug:
    const args = new DepositCapitalArgs({amount: new BN(amount)});

    const data = Buffer.from(
        serialize(getGovernanceSchema(2), args),
    );

    const [capitalTokenHoldingAccount] = await PublicKey.findProgramAddress(
        [
            capitalGovernance.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            capitalTokenMint.toBuffer()
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    )

    const [lpHoldingAccount, bump] = await PublicKey.findProgramAddress(
        [
            lpGovernance.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            lpTokenMint.toBuffer()
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    )

    console.log("bump = ", bump);

    const keys = [
        { pubkey: realm, isWritable: false, isSigner: false }, // 0
        { pubkey: capitalGovernance, isWritable: false, isSigner: false }, // 1
        { pubkey: lpGovernance, isWritable: true, isSigner: false }, // 2
        { pubkey: lpGovernedAccount, isWritable: false, isSigner: false }, // 3
        { pubkey: capitalTokenAuthority, isWritable: true, isSigner: true }, // 4
        { pubkey: capitalTokenAccount, isWritable: true, isSigner: false }, // 5
        { pubkey: capitalTokenHoldingAccount, isWritable: true, isSigner: false }, // 6
        { pubkey: capitalTokenMint, isWritable: false, isSigner: false }, // 7
        { pubkey: lpTokenAccount, isWritable: true, isSigner: false }, // 8
        { pubkey: lpHoldingAccount, isWritable: true, isSigner: false }, // 9
        { pubkey: lpTokenMint, isWritable: false, isSigner: false }, // 10
        { pubkey: TOKEN_PROGRAM_ID, isWritable: false, isSigner: false }, // 11
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isWritable: false, isSigner: false }, // 12
        { pubkey: SYSTEM_PROGRAM_ID, isWritable: false, isSigner: false }, // 13
    ];

    instructions.push(
        new TransactionInstruction({
            keys,
            programId,
            data,
        })
    );

};
