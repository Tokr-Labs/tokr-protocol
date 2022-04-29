import fs from "fs"
import * as anchor from "@project-serum/anchor";
import {loadKeypair} from "../utils/load-keypair";
import {createRecordInstruction} from "../../js/src/index"
import {Commitment, Connection, sendAndConfirmTransaction, Transaction} from "@solana/web3.js";

export async function createRecord(options: any) {

    let userKeypair = await loadKeypair(options.user);
    let authorityPublicKey = options.authority;
    let programPublicKey = new anchor.web3.PublicKey(options.program);
    let groupPublicKey = new anchor.web3.PublicKey(options.group);

    // @ts-ignore
    const content = fs.readFileSync(process.env.CONFIG.toString());
    const config = content.toString();

    let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")![1]
    rpcUrl = rpcUrl.replace(/(")+/gi, "")

    const commitment: Commitment = rpcUrl.match(/local/) ? "processed" : "confirmed"

    const connection = new Connection(rpcUrl, commitment);

    const tix = await createRecordInstruction(
        connection,
        userKeypair.publicKey,
        groupPublicKey,
        authorityPublicKey,
        programPublicKey
    )

    const tx = new Transaction()

    tx.add(tix);

    const txs = await sendAndConfirmTransaction(
        connection,
        tx,
        [userKeypair]
    )

    console.log(txs);

    process.exit(1);

}