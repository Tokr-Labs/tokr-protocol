import fs from "fs";
import {Keypair} from "@solana/web3.js";

export async function loadKeypair(fileRef: string) {

    let contents = await fs.readFileSync(fileRef);

    let parsed = String(contents)
        .replace("[", "")
        .replace("]", "")
        .split(",")
        .map((item) => Number(item))

    const uint8Array = Uint8Array.from(parsed);

    return Keypair.fromSecretKey(uint8Array);

}