import {
    PublicKey,
    SYSVAR_CLOCK_PUBKEY,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction,
} from '@solana/web3.js';
import {getGovernanceSchema} from './serialisation';
import {serialize} from 'borsh';
import {CastVoteArgs, Vote} from './instructions';
import {getVoteRecordAddress} from './accounts';
import {SYSTEM_PROGRAM_ID} from '../tools/sdk/runtime';
import {withRealmConfigAccounts} from './withRealmConfigAccounts';

export const withCastVote = async (
    instructions: TransactionInstruction[],
    programId: PublicKey,
    programVersion: number,
    realm: PublicKey,
    governance: PublicKey,
    proposal: PublicKey,
    proposalOwnerRecord: PublicKey,
    tokenOwnerRecord: PublicKey,
    governanceAuthority: PublicKey,
    governingTokenMint: PublicKey,
    vote: Vote,
    payer: PublicKey,
    voterWeightRecord?: PublicKey,
    maxVoterWeightRecord?: PublicKey,
) => {
    const args = new CastVoteArgs(
        {yesNoVote: undefined, vote: vote},
    );
    const data = Buffer.from(
        serialize(getGovernanceSchema(), args),
    );

    const voteRecordAddress = await getVoteRecordAddress(
        programId,
        proposal,
        tokenOwnerRecord,
    );

    const [realmIsWritable, governanceIsWritable] = [true, true];

    const keys = [
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
            pubkey: tokenOwnerRecord,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: governanceAuthority,
            isWritable: false,
            isSigner: true,
        },
        {
            pubkey: voteRecordAddress,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: governingTokenMint,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: payer,
            isWritable: false,
            isSigner: true,
        },
        {
            pubkey: SYSTEM_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
        },
    ];

    await withRealmConfigAccounts(
        keys,
        programId,
        realm,
        voterWeightRecord,
        maxVoterWeightRecord,
    );

    instructions.push(
        new TransactionInstruction({
            keys,
            programId,
            data,
        }),
    );

    return voteRecordAddress;
};
