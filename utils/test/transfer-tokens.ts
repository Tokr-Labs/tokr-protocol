import {Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction} from "@solana/web3.js";
import {createTransferInstruction} from "@solana/spl-token";

export async function transferTokens(
    connection: Connection,
    owner: Keypair,
    fromAccountAddress: PublicKey,
    toAccountAddress: PublicKey,
    amount: number
) {

    const transaction = new Transaction()
        .add(
            createTransferInstruction(
                fromAccountAddress,
                toAccountAddress,
                owner.publicKey,
                amount
            )
        );

    await sendAndConfirmTransaction(
        connection,
        transaction,
        [owner]
    );

}