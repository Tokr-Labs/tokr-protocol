import {PublicKey, TransactionInstruction} from '@solana/web3.js';
import {getGovernanceSchema} from './serialisation';
import {serialize} from 'borsh';
import BN from 'bn.js';
import {SYSTEM_PROGRAM_ID} from '../tools/sdk/runtime';
import {TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID} from '../tools/sdk/splToken';
import {DepositCapitalArgs} from "./instructions";
import {GOVERNANCE_PROGRAM_SEED} from "./accounts";

export const withDepositCapital = async (
    instructions: TransactionInstruction[],
    programId: PublicKey,
    realm: PublicKey,
    usdcTokenSource: PublicKey,
    usdcTokenMint: PublicKey,
    lpTokenMint: PublicKey,
    usdcTokenOwner: PublicKey,
    usdcTransferAuthority: PublicKey,
    lpTransferAuthority: PublicKey,
    payer: PublicKey,
    amount: BN,
) => {

    const args = new DepositCapitalArgs({amount});
    const data = Buffer.from(
        serialize(getGovernanceSchema(2), args),
    );

    const [usdcHoldingAddress] = await PublicKey.findProgramAddress(
        [
            Buffer.from(GOVERNANCE_PROGRAM_SEED),
            realm.toBuffer(),
            usdcTokenMint.toBuffer(),
        ],
        programId,
    );

    const [lpTokenDestinationAccount] = await PublicKey.findProgramAddress(
        [
            payer.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            lpTokenMint.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const keys = [
        { pubkey: realm, isWritable: false, isSigner: false },
        { pubkey: usdcHoldingAddress, isWritable: true, isSigner: false },
        { pubkey: usdcTokenSource, isWritable: true, isSigner: false },
        { pubkey: usdcTokenOwner, isWritable: false, isSigner: true },
        { pubkey: payer, isWritable: false, isSigner: true },
        { pubkey: payer, isWritable: false, isSigner: true },
        { pubkey: lpTokenDestinationAccount, isWritable: true, isSigner: false },
        { pubkey: payer, isWritable: true, isSigner: true },
        { pubkey: SYSTEM_PROGRAM_ID, isWritable: false, isSigner: false },
        { pubkey: TOKEN_PROGRAM_ID, isWritable: false, isSigner: false },
    ];

    instructions.push(
        new TransactionInstruction({
            keys,
            programId,
            data,
        }),
    );

};
