import fs from "fs";
import {loadKeypair} from "./load-keypair";
import * as path from "path";
import {Keypair} from "@solana/web3.js";

export async function getLocalnetProgramId(): Promise<string> {

    const keypairPath = path.resolve("../../target/deploy/permissioned_list-keypair.json")

    try {

        const keypair = await loadKeypair(keypairPath)
        return keypair.publicKey.toBase58()

    } catch {

        console.warn(`Keypair was not found at: ${keypairPath}.`)
        return Keypair.generate().publicKey.toBase58()

    }

}