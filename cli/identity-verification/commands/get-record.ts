import fs from "fs";
import {createIdentityVerificationServiceWith} from "../../../programs/identity-verification/js/src/index"
import {Commitment, Connection, PublicKey} from "@solana/web3.js";

export async function getIdentityVerificationRecord(options: any) {

    let userPubkey = new PublicKey(options.user);
    let programPublicKey = new PublicKey(options.program);
    let groupPublicKey = new PublicKey(options.group);

    // @ts-ignore
    const content = fs.readFileSync(process.env.CONFIG.toString());
    const config = content.toString();

    let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")![1]
    rpcUrl = rpcUrl.replace(/(")+/gi, "")

    const commitment: Commitment = rpcUrl.match(/local/) ? "processed" : "confirmed"
    const connection = new Connection(rpcUrl, commitment);
    const service = createIdentityVerificationServiceWith(connection, programPublicKey)

    const record = await service.getRecord(
        userPubkey,
        groupPublicKey
    )

    console.log(`Record Authority: ${record.authority}`)
    console.log(`KYC Status: ${record.kycStatus}`)
    console.log(`AML Status: ${record.amlStatus}`)
    console.log(`Investor Accreditation Status: ${record.iaStatus}`)

    process.exit(1);

}