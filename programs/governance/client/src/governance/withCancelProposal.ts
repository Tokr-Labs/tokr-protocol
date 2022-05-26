import {
    AccountMeta,
    PublicKey,
    SYSVAR_CLOCK_PUBKEY,
    TransactionInstruction,
} from '@solana/web3.js';
import {GOVERNANCE_SCHEMA} from './serialisation';
import {serialize} from 'borsh';
import {CancelProposalArgs} from './instructions';

export const withCancelProposal = (
    instructions: TransactionInstruction[],
    programId: PublicKey,
    realm: PublicKey,
    governance: PublicKey,
    proposal: PublicKey,
    proposalOwnerRecord: PublicKey,
    governanceAuthority: PublicKey,
) => {
    const args = new CancelProposalArgs();
    const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

    let keys: AccountMeta[] = [];

    keys.push(
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
            pubkey: governanceAuthority,
            isWritable: false,
            isSigner: true,
        },
    );

    instructions.push(
        new TransactionInstruction({
            keys,
            programId,
            data,
        }),
    );
};
