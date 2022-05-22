import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {createAssociatedTokenAccount} from "@solana/spl-token";

export async function createAta(connection: Connection, mintAddress: PublicKey, keypair: Keypair): Promise<PublicKey> {
    return await createAssociatedTokenAccount(
        connection,
        keypair,
        mintAddress,
        keypair.publicKey
    )
}