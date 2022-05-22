import fs from "fs";
import {Keypair} from "@solana/web3.js";
import path from "path";

export async function loadKeypair(fileRef: string) {

    let filePath = fileRef;

    if (filePath[0] === '~') {
        filePath = path.join(process.env.HOME!, filePath.slice(1));
    }

    let contents = await fs.readFileSync(`${filePath}`);

    let parsed = String(contents)
        .replace("[", "")
        .replace("]", "")
        .split(",")
        .map((item) => Number(item))

    const uint8Array = Uint8Array.from(parsed);

    return Keypair.fromSecretKey(uint8Array);

}