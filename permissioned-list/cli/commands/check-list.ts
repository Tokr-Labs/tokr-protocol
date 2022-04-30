import {PublicKey} from "@solana/web3.js";

export async function checkList(options: any) {

    console.log(`Checking list '${options.list}' for user '${options.user}'...`)

    const user = new PublicKey(options.user)
    const list = new PublicKey(options.list)
    const program = new PublicKey(options.program)

    process.exit(1);

}