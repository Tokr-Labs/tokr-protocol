import {PublicKey} from "@solana/web3.js";
import process from "process";
import * as anchor from "@project-serum/anchor";
import {Program} from "@project-serum/anchor";
import {PermissionedList} from "../../../target/types/permissioned_list";
import {loadKeypair} from "../../utils/load-keypair";
import {getRpcUrl} from "../../utils/get-rpc-url";

export async function addUser(options: any) {

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

    console.log(`Adding user '${userPublicKey.toBase58()}' to list '${listPdaPublicKey.toBase58()}'...`)

    const signature = await program.rpc.addUser({
        accounts: {
            signer: signerKeypair.publicKey,
            list: listPdaPublicKey,
            user: userPublicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            entry: entryPdaPubkey
        },
        signers: [signerKeypair]
    })

    console.log("Signature: ", signature);

    process.exit(1);

}