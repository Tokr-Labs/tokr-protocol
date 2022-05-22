import {Connection, Keypair} from "@solana/web3.js";
import {requestAirdrop} from "./request-airdrop";

export async function createAccount(
    connection: Connection
) {

    const keypair = Keypair.generate();
    await requestAirdrop(connection, keypair.publicKey)

    return keypair;

}