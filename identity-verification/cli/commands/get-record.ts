import fs from "fs";
import {getRecord} from "../../js/src/index"
import {Connection, PublicKey} from "@solana/web3.js";

export async function getIdentityVerificationRecord(options: any) {

    let userPubkey = new PublicKey(options.user);
    let programPublicKey = new PublicKey(options.program);
    let groupPublicKey = new PublicKey(options.group);

    // @ts-ignore
    const content = fs.readFileSync(process.env.CONFIG.toString());
    const config = content.toString();

    let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")![1]
    rpcUrl = rpcUrl.replace(/(")+/gi, "")

    const record = await getRecord(
        new Connection(rpcUrl),
        userPubkey,
        groupPublicKey,
        programPublicKey
    )

    console.log(`Record Authority: ${record.authority}`)
    console.log(`KYC Status: ${record.kycStatus}`)
    console.log(`AML Status: ${record.amlStatus}`)
    console.log(`Investor Accreditation Status: ${record.iaStatus}`)

    process.exit(1);

}