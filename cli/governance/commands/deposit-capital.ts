import {Connection, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction} from "@solana/web3.js";
import {loadKeypair} from "../../utils/load-keypair";
import {getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount} from "@solana/spl-token";
import {withDepositCapital} from "../../../programs/governance/js/src/governance/withDepositCaptial"
import {readFileSync} from "fs";
import process from "process";
import {validateDepositCapitalConfig} from "../../utils/validate-capital-config";
import {resolveHome} from "../../utils/resolve-home";

export const depositCapital = async (inputFile: string) => {

    const file = resolveHome(inputFile);
    const configStr = readFileSync(file, {encoding: "utf8"})
    const config = JSON.parse(configStr);

    if (!validateDepositCapitalConfig(config)) {
        console.error("Invalid JSON format detected.")
        process.exit(1)
    }

    console.log(`Depositing ${config.amount} USDC as capital...`)

    const programId = new PublicKey(config.governanceProgramId);
    const identityVerificationProgramId = new PublicKey(config.identityVerificationProgramId);
    const rpcEndpoint = config.cluster;

    const connection = new Connection(rpcEndpoint, {
        commitment: "recent"
    });

    let instructions: TransactionInstruction[] = [];

    const ownerKeypair = await loadKeypair(config.owner);
    const realmPublicKey = new PublicKey(config.realm);
    const usdcMint = new PublicKey(config.usdcMint);
    const lpGovernance = new PublicKey(config.lpGovernance);
    const lpMintPublicKey = new PublicKey(config.lpMint);
    const delegateMintGovernance = new PublicKey(config.delegateMintGovernance);
    const delegateTokenMint = new PublicKey(config.delegateTokenMint);

    const usdcTokenSource = await getOrCreateAssociatedTokenAccount(
        connection,
        ownerKeypair,
        usdcMint,
        ownerKeypair.publicKey
    )

    const lpTokenAccount = await getAssociatedTokenAddress(lpMintPublicKey, ownerKeypair.publicKey)

    await withDepositCapital(
        instructions,
        programId,
        identityVerificationProgramId,
        realmPublicKey,
        lpGovernance,
        delegateMintGovernance,
        ownerKeypair.publicKey,
        usdcTokenSource.address,
        usdcMint,
        lpTokenAccount,
        lpMintPublicKey,
        delegateTokenMint,
        config.amount
    )

    const tx = new Transaction()
    tx.add(...instructions);

    await sendAndConfirmTransaction(
        connection,
        tx,
        [ownerKeypair],
        {
            skipPreflight: true
        }
    )

    console.log("Deposit complete.")

    process.exit();

};