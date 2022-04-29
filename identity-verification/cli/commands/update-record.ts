import {loadKeypair} from "../utils/load-keypair";
import fs from "fs";
import {Commitment, Connection, Keypair, PublicKey} from "@solana/web3.js";

import {getRecord, Status, updateAmlStatus, updateIaStatus, updateKycStatus} from "../../js/src/index"

export async function updateRecord(options: any, approve: boolean) {

    console.log(`${approve ? "Approving" : "Denying"} record status...`)

    let authorityKeypair: Keypair = await loadKeypair(options.authority);
    let userPublicKey = new PublicKey(options.user);
    let programPublicKey = new PublicKey(options.program);
    let groupPublicKey = new PublicKey(options.group);

    // @ts-ignore
    const content = fs.readFileSync(process.env.CONFIG.toString());
    const config = content.toString();

    let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")![1]
    rpcUrl = rpcUrl.replace(/(")+/gi, "")

    const commitment: Commitment = rpcUrl.match(/local/) ? "processed" : "confirmed"

    console.log("Updating IA status...")

    const sig1 = await updateIaStatus(
        new Connection(rpcUrl, commitment),
        userPublicKey,
        groupPublicKey,
        authorityKeypair,
        approve ? Status.approved : Status.denied,
        programPublicKey
    )

    console.log(`IA Transaction Signature: ${sig1}`)

    console.log("Updating KYC status...")

    const sig2 = await updateKycStatus(
        new Connection(rpcUrl, commitment),
        userPublicKey,
        groupPublicKey,
        authorityKeypair,
        approve ? Status.approved : Status.denied,
        programPublicKey
    )

    console.log(`KYC Transaction Signature: ${sig2}`)

    console.log("Updating AML status...")

    const sig3 = await updateAmlStatus(
        new Connection(rpcUrl, commitment),
        userPublicKey,
        groupPublicKey,
        authorityKeypair,
        approve ? Status.approved : Status.denied,
        programPublicKey
    )

    console.log(`AML Transaction Signature: ${sig3}`)

    const record = await getRecord(
        new Connection(rpcUrl, commitment),
        userPublicKey,
        groupPublicKey,
        programPublicKey
    )

    console.log(`Record Authority: ${record.authority}`)
    console.log(`KYC Status: ${record.kycStatus}`)
    console.log(`AML Status: ${record.amlStatus}`)
    console.log(`IA Status: ${record.iaStatus}`)

    process.exit(1);

}