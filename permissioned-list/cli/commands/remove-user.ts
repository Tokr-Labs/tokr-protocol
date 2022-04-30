import {PublicKey} from "@solana/web3.js";
import {loadKeypair} from "../utils/load-keypair";

export async function removeUser(options: any, approve: boolean) {

    console.log(`Removing user '${options.user}' from list '${options.list}'...`)

    const signer = await loadKeypair(options.signer)
    const user = new PublicKey(options.user)
    const list = new PublicKey(options.list)
    const program = new PublicKey(options.program)

    process.exit(1);

}