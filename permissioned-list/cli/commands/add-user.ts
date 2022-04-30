import {loadKeypair} from "../utils/load-keypair";
import {PublicKey} from "@solana/web3.js";

export async function addUser(options: any) {

    const signer = await loadKeypair(options.signer)
    const list = new PublicKey(options.list)
    const program = new PublicKey(options.program)

    console.log(`Adding user '${options.user}' to list '${options.list}'...`)

    process.exit(1);

}