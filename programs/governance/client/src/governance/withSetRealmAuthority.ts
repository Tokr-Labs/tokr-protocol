import {PublicKey, TransactionInstruction} from '@solana/web3.js';
import {getGovernanceSchema} from './serialisation';
import {serialize} from 'borsh';
import {SetRealmAuthorityAction, SetRealmAuthorityArgs} from './instructions';

export const withSetRealmAuthority = (
    instructions: TransactionInstruction[],
    programId: PublicKey,
    realm: PublicKey,
    realmAuthority: PublicKey,
    newRealmAuthority: PublicKey | undefined,
    action: SetRealmAuthorityAction | undefined,
) => {
    const args = new SetRealmAuthorityArgs({
        newRealmAuthority: newRealmAuthority, // V1
        action: action, // V2
    });
    const data = Buffer.from(
        serialize(getGovernanceSchema(), args),
    );

    let keys = [
        {
            pubkey: realm,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: realmAuthority,
            isWritable: false,
            isSigner: true,
        },
        {
            pubkey: newRealmAuthority!,
            isWritable: false,
            isSigner: false,
        }
    ];

    instructions.push(
        new TransactionInstruction({
            keys,
            programId,
            data,
        }),
    );
};
