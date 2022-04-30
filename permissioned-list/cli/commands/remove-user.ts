import {PublicKey} from "@solana/web3.js";
import {loadKeypair} from "../utils/load-keypair";
import process from "process";
import {getRpcUrl} from "../utils/get-rpc-url";
import * as anchor from "@project-serum/anchor";
import {Program} from "@project-serum/anchor";
import {PermissionedList} from "../../../target/types/permissioned_list";

export async function removeUser(options: any, approve: boolean) {

    const signerKeypair = await loadKeypair(options.signer)
    const userPublicKey = new PublicKey(options.user)

    process.env.ANCHOR_PROVIDER_URL = await getRpcUrl()

    const program = anchor.workspace.PermissionedList as Program<PermissionedList>;

    const [listPdaPublicKey] = await PublicKey.findProgramAddress([
        Buffer.from("list", "utf-8"),
        signerKeypair.publicKey.toBytes()
    ], program.programId);

    const [entryPdaPubkey] = await PublicKey.findProgramAddress([
        listPdaPublicKey.toBytes(),
        userPublicKey.toBytes()
    ], program.programId);

    console.log(`Removing user '${userPublicKey.toBase58()}' from list '${listPdaPublicKey.toBase58()}'...`)

    const signature = await program.rpc.removeUser({
        accounts: {
            signer: signerKeypair.publicKey,
            list: listPdaPublicKey,
            entry: entryPdaPubkey,
            user: userPublicKey
        },
        signers: [signerKeypair]
    })

    console.log("Signature: ", signature);

    process.exit(1);

}