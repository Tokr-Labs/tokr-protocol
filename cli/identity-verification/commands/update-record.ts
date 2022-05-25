import {loadKeypair} from "../../utils/load-keypair";
import fs from "fs";
import {Commitment, Connection, Keypair, PublicKey} from "@solana/web3.js";
import {IdentityVerificationService} from "../../../programs/identity-verification/client/src/services/identity-verification-service"
import {IdentityStatus} from "../../../programs/identity-verification/client/src/models/identity-status"

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
    const connection = new Connection(rpcUrl, commitment);

    const service = new IdentityVerificationService(connection, programPublicKey)

    console.log("Updating IA status...")

    const sig1 = await service.updateIaStatus(
        userPublicKey,
        groupPublicKey,
        authorityKeypair,
        approve ? IdentityStatus.approved : IdentityStatus.denied,
    )

    console.log(`IA Transaction Signature: ${sig1}`)

    console.log("Updating KYC status...")

    const sig2 = await service.updateKycStatus(
        userPublicKey,
        groupPublicKey,
        authorityKeypair,
        approve ? IdentityStatus.approved : IdentityStatus.denied,
    )

    console.log(`KYC Transaction Signature: ${sig2}`)

    console.log("Updating AML status...")

    const sig3 = await service.updateAmlStatus(
        userPublicKey,
        groupPublicKey,
        authorityKeypair,
        approve ? IdentityStatus.approved : IdentityStatus.denied,
    )

    console.log(`AML Transaction Signature: ${sig3}`)

    const record = await service.getRecord(
        userPublicKey,
        groupPublicKey,
    )

    console.log(`Record Authority: ${record.authority}`)
    console.log(`KYC Status: ${record.kycStatus}`)
    console.log(`AML Status: ${record.amlStatus}`)
    console.log(`IA Status: ${record.iaStatus}`)

    process.exit(1);

}