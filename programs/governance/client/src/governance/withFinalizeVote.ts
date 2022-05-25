import {
    PublicKey,
    SYSVAR_CLOCK_PUBKEY,
    TransactionInstruction,
} from '@solana/web3.js';
import {GOVERNANCE_SCHEMA} from './serialisation';
import {serialize} from 'borsh';
import {FinalizeVoteArgs} from './instructions';
import {withRealmConfigAccounts} from './withRealmConfigAccounts';

export const withFinalizeVote = async (
    instructions: TransactionInstruction[],
    programId: PublicKey,
    programVersion: number,
    realm: PublicKey,
    governance: PublicKey,
    proposal: PublicKey,
    proposalOwnerRecord: PublicKey,
    governingTokenMint: PublicKey,
    maxVoterWeightRecord?: PublicKey,
) => {
    const args = new FinalizeVoteArgs();
    const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

    const [realmIsWritable, governanceIsWritable] = [true, true];

    let keys = [
        {
            pubkey: realm,
            isWritable: realmIsWritable,
            isSigner: false,
        },
        {
            pubkey: governance,
            isWritable: governanceIsWritable,
            isSigner: false,
        },
        {
            pubkey: proposal,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: proposalOwnerRecord,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: governingTokenMint,
            isWritable: false,
            isSigner: false,
        },
    ];

    await withRealmConfigAccounts(
        keys,
        programId,
        realm,
        undefined,
        maxVoterWeightRecord,
    );

    instructions.push(
        new TransactionInstruction({
            keys,
            programId,
            data,
        }),
    );
};
