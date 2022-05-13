import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    Transaction
} from "@solana/web3.js";
import {createAssociatedTokenAccount, createTransferInstruction} from "@solana/spl-token";

export async function helper_requestAirdrop(connection: Connection, walletPk: PublicKey) {
    const airdropSignature = await connection.requestAirdrop(
        walletPk,
        LAMPORTS_PER_SOL,
    );

    await connection.confirmTransaction(airdropSignature);
}

export async function helper_createAccount(connection: Connection) {
    const keypair = Keypair.generate();
    await helper_requestAirdrop(connection, keypair.publicKey)
    return keypair;
}

export async function helper_createAtaForKeypair(connection: Connection, mintAddress: PublicKey, keypair: Keypair): Promise<PublicKey> {
    return await createAssociatedTokenAccount(
        connection,
        keypair,
        mintAddress,
        keypair.publicKey
    )
}

export async function helper_transferTokens(connection: Connection, owner: Keypair, fromAccountAddress: PublicKey, toAccountAddress: PublicKey, amount: number) {
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