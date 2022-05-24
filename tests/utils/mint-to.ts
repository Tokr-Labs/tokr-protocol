import {PublicKey, TransactionInstruction} from '@solana/web3.js'
import {createMintToInstruction} from "@solana/spl-token";

export const withMintTo = async (
    instructions: TransactionInstruction[],
    mintPk: PublicKey,
    destinationPk: PublicKey,
    mintAuthorityPk: PublicKey,
    amount: number | bigint
) => {
    instructions.push(
        createMintToInstruction(
            mintPk,
            destinationPk,
            mintAuthorityPk,
            amount,
            [],
        )
    )
}
