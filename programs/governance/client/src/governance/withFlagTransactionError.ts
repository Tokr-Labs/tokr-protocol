import {
    PublicKey,
    SYSVAR_CLOCK_PUBKEY,
    TransactionInstruction,
} from '@solana/web3.js';
import {GOVERNANCE_SCHEMA} from './serialisation';
import {serialize} from 'borsh';
import {FlagTransactionErrorArgs} from './instructions';

export const withFlagTransactionError = (
    instructions: TransactionInstruction[],
    programId: PublicKey,
    proposal: PublicKey,
    tokenOwnerRecord: PublicKey,
    governanceAuthority: PublicKey,
    proposalTransaction: PublicKey,
) => {
    const args = new FlagTransactionErrorArgs();
    const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

    const keys = [
        {
            pubkey: proposal,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: tokenOwnerRecord,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: governanceAuthority,
            isWritable: false,
            isSigner: true,
        },
        {
            pubkey: proposalTransaction,
            isWritable: true,
            isSigner: false,
        },
    ];

    instructions.push(
        new TransactionInstruction({
            keys,
            programId,
            data,
        }),
    );
};
