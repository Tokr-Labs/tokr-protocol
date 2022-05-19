import {PublicKey} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import {PermissionedList} from "../../../target/types/permissioned_list"
import {Program} from "@project-serum/anchor";
import * as process from "process";
import {loadKeypair} from "../../../utils/cli/load-keypair";
import {getRpcUrl} from "../../../utils/cli/get-rpc-url";

export async function deleteList(options: any) {

    const signerKeypair = await loadKeypair(options.signer)

    process.env.ANCHOR_PROVIDER_URL = await getRpcUrl()

    const program = anchor.workspace.PermissionedList as Program<PermissionedList>;

    const [listPda] = await PublicKey.findProgramAddress([
        Buffer.from("list", "utf-8"),
        signerKeypair.publicKey.toBytes()
    ], program.programId);

    console.log(`Deleting list '${listPda.toBase58()}'...`)

    const signature = await program.rpc.deleteList({
        accounts: {
            signer: signerKeypair.publicKey,
            list: listPda
        },
        signers: [signerKeypair]
    })

    console.log("Signature: ", signature);

    process.exit(1);

}