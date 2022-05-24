import {Connection, Keypair, Transaction, TransactionInstruction} from "@solana/web3.js";

export async function sendTransaction(connection: Connection, instructions: TransactionInstruction[], signers: Keypair[], feePayer: Keypair) {
    let transaction = new Transaction({ feePayer: feePayer.publicKey })
    transaction.add(...instructions)
    signers.push(feePayer);
    let tx = await connection.sendTransaction(transaction, signers)

    await connection.confirmTransaction(tx);
}