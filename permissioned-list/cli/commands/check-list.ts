import {PublicKey} from "@solana/web3.js";
import process from "process";
import * as anchor from "@project-serum/anchor";
import {Program} from "@project-serum/anchor";
import {PermissionedList} from "../../../target/types/permissioned_list"
import {loadKeypair} from "../../../utils/cli/load-keypair";
import {getRpcUrl} from "../../../utils/cli/get-rpc-url";

export async function checkList(options: any) {

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

    console.log(`Checking list '${listPdaPublicKey.toBase58()}' for user '${userPublicKey.toBase58()}'...`)

    const record = await anchor.getProvider().connection.getAccountInfo(entryPdaPubkey, "confirmed");

    if (record) {
        console.log("User is on the list.")
    } else {
        console.log("User is not on the list.")
    }

    process.exit(1);

}