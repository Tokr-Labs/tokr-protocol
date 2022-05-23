import {PublicKey} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import {PermissionedList} from "../../../target/types/permissioned_list"
import {Program} from "@project-serum/anchor";
import * as process from "process";
import {loadKeypair} from "../../utils/load-keypair";
import {getRpcUrl} from "../../utils/get-rpc-url";

export async function createList(options: any) {

    const signerKeypair = await loadKeypair(options.signer)

    process.env.ANCHOR_PROVIDER_URL = await getRpcUrl()

    const program = anchor.workspace.PermissionedList as Program<PermissionedList>;

    const [listPda] = await PublicKey.findProgramAddress([
        Buffer.from("list", "utf-8"),
        signerKeypair.publicKey.toBytes()
    ], program.programId);

    console.log(`Creating list '${listPda.toBase58()}'...`)

    const signature = await program.rpc.createList({
        accounts: {
            signer: signerKeypair.publicKey,
            list: listPda,
            systemProgram: anchor.web3.SystemProgram.programId
        },
        signers: [signerKeypair]
    })

    console.log("Signature: ", signature);

    process.exit(1);

}