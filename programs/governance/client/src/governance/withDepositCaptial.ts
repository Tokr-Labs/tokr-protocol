import {PublicKey, SYSVAR_RENT_PUBKEY, TransactionInstruction} from '@solana/web3.js';
import BN from 'bn.js';
import {DepositCapitalArgs} from "./instructions";
import {serialize} from 'borsh';
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    SYSTEM_PROGRAM_ID,
    TOKEN_PROGRAM_ID
} from "../tools";
import {getGovernanceSchema} from "./serialisation";

/**
 *
 * @param instructions mutable transaction instruction array
 * @param programId governance program id
 * @param identityVerificationProgramId identity verification program id
 * @param realm public key of realm
 * @param capitalGovernance governance over the usdc account
 * @param lpGovernance
 * @param capitalTokenAuthority the owner of the usdc account being transfered from
 * @param capitalTokenAccount the spl token ata account of the user
 * @param capitalTokenMint spl token mint
 * @param lpTokenAccount treasury stock account
 * @param lpTokenMint treasury stock mint
 * @param delegateTokenMint treasury stock transfer signer
 * @param amount amount of spl token to transfer in
 * @param decimals the decimal of the spl token
 */
export const withDepositCapital = async (
    instructions: TransactionInstruction[],
    programId: PublicKey,
    identityVerificationProgramId: PublicKey,
    realm: PublicKey,
    capitalGovernance: PublicKey,
    lpGovernance: PublicKey,
    capitalTokenAuthority: PublicKey,
    capitalTokenAccount: PublicKey,
    capitalTokenMint: PublicKey,
    lpTokenAccount: PublicKey,
    lpTokenMint: PublicKey,
    delegateTokenMint: PublicKey,
    amount: number,
    decimals: number,
) => {

    const args = new DepositCapitalArgs({
        amount: new BN(amount),
        decimals: new BN(decimals)
    });

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

    const [identityVerificationRecord] = await PublicKey.findProgramAddress(
        [
            Buffer.from("identity"),
            realm.toBuffer(),
            capitalTokenAuthority.toBuffer()
        ],
        identityVerificationProgramId
    )

    const keys = [
        {pubkey: realm, isWritable: false, isSigner: false}, // 0
        {pubkey: lpGovernance, isWritable: true, isSigner: false}, // 1
        {pubkey: capitalTokenAuthority, isWritable: true, isSigner: true}, // 2
        {pubkey: capitalTokenAccount, isWritable: true, isSigner: false}, // 3
        {pubkey: capitalTokenHoldingAccount, isWritable: true, isSigner: false}, // 4
        {pubkey: lpTokenAccount, isWritable: true, isSigner: false}, // 5
        {pubkey: lpHoldingAccount, isWritable: true, isSigner: false}, // 6
        {pubkey: lpTokenMint, isWritable: false, isSigner: false}, // 7
        {pubkey: delegateTokenMint, isWritable: false, isSigner: false}, // 8
        {pubkey: identityVerificationRecord, isWritable: false, isSigner: false}, // 9
        {pubkey: identityVerificationProgramId, isWritable: false, isSigner: false}, // 10
        {pubkey: TOKEN_PROGRAM_ID, isWritable: false, isSigner: false}, // 11
        {pubkey: SYSTEM_PROGRAM_ID, isWritable: false, isSigner: false}, // 12
        {pubkey: SYSVAR_RENT_PUBKEY, isWritable: false, isSigner: false}, // 13
        // even though we never use this it has to be added or the lp ata account creation fails
        {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isWritable: false, isSigner: false}, // 14
    ];

    instructions.push(
        new TransactionInstruction({
            keys,
            programId,
            data,
        })
    );

};
