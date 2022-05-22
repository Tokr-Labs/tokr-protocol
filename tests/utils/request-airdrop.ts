import {Connection, LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";

export async function requestAirdrop(
    connection: Connection,
    walletPk: PublicKey
) {

    const airdropSignature = await connection.requestAirdrop(
        walletPk,
        LAMPORTS_PER_SOL,
    );

    await connection.confirmTransaction(airdropSignature);

}