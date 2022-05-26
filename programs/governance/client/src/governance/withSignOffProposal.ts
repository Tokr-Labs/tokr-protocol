import {
    AccountMeta,
    PublicKey,
    SYSVAR_CLOCK_PUBKEY,
    TransactionInstruction,
} from '@solana/web3.js';
import {GOVERNANCE_SCHEMA} from './serialisation';
import {serialize} from 'borsh';
import {SignOffProposalArgs} from './instructions';

export const withSignOffProposal = (
    instructions: TransactionInstruction[],
    programId: PublicKey,
    realm: PublicKey,
    governance: PublicKey,
    proposal: PublicKey,
    signatory: PublicKey,
    signatoryRecord: PublicKey | undefined,
    proposalOwnerRecord: PublicKey | undefined,
) => {
    const args = new SignOffProposalArgs();
    const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

    let keys: AccountMeta[] = [
        {
            pubkey: realm,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: governance,
            isWritable: true,
            isSigner: false,
        }
    ];

    keys.push({
        pubkey: proposal,
        isWritable: true,
        isSigner: false,
    });


    keys.push({
        pubkey: signatory,
        isWritable: false,
        isSigner: true,
    });

    if (proposalOwnerRecord) {
        keys.push({
            pubkey: proposalOwnerRecord,
            isWritable: false,
            isSigner: false,
        });
    } else {
        keys.push({
            pubkey: signatoryRecord!,
            isWritable: true,
            isSigner: false,
        });
    }

    instructions.push(
        new TransactionInstruction({
            keys,
            programId,
            data,
        }),
    );
};
