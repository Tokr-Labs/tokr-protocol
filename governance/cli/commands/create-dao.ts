import {spawn} from "child_process";
import BN from "bn.js";
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js"

import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    createInitializeMintInstruction,
    createMintToInstruction,
    MintLayout,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token"

import {
    GovernanceConfig,
    MintMaxVoteWeightSource,
    VoteThresholdPercentage
} from "../../js/src/governance/accounts"
import {withDepositGoverningTokens} from '../../js/src/governance/withDepositGoverningTokens'
import {withCreateMintGovernance} from '../../js/src/governance/withCreateMintGovernance'
import {withSetRealmAuthority} from '../../js/src/governance/withSetRealmAuthority'
import {withCreateRealm} from '../../js/src/governance/withCreateRealm'
import * as fs from "fs";
import path from "path";
import {readFileSync} from "fs";
import {isNumber, isString} from "underscore"
import * as process from "process";

export const createDao = async (
    configFile: string,
) => {

    const configStr = readFileSync(configFile, {encoding: "utf8"})
    const config = JSON.parse(configStr);

    if (!validateConfig(config)) {
        console.error("Invalid JSON format detected.")
        process.exit(1)
    }

    const cluster = config.cluster;
    const owner = config.owner;
    const delegate = config.delegate;
    const name = config.name;
    const governanceProgramId = config.governanceProgramId;
    const usdcMint = config.usdcMint;
    const governanceConfig = config.governance;

    console.log();
    console.log("Input:")
    console.log();
    console.log(config)
    console.log();

    console.log("Updating local solana configuration...")
    await updateLocalConfig(owner, cluster);

    const connection = new Connection(cluster, {
        commitment: "confirmed"
    })

    const ownerKeypair = await loadKeypair(owner);
    const delegateKeypair = await loadKeypair(delegate);
    const governanceProgramIdPublicKey = new PublicKey(governanceProgramId);
    const usdcMintPublicKey = new PublicKey(usdcMint);
    const limitedPartnerMintKeypair = Keypair.generate();
    const delegateMintKeypair = Keypair.generate();
    const distributionMintKeypair = Keypair.generate();

    const delegateAtaPublicKey = (await PublicKey.findProgramAddress(
        [
            delegateKeypair.publicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            delegateMintKeypair.publicKey.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];

    console.log("Starting 123.");
    console.log();

    let mintInstructions: TransactionInstruction[] = [];

    console.log("Creating mint instructions for lp...")
    await createMintInstructions(
        mintInstructions,
        connection,
        limitedPartnerMintKeypair,
        ownerKeypair,
        0
    )

    console.log("Creating mint instructions for delegate...")
    await createMintInstructions(
        mintInstructions,
        connection,
        delegateMintKeypair,
        ownerKeypair,
        0
    )

    console.log("Creating mint instructions for distribution...")
    await createMintInstructions(
        mintInstructions,
        connection,
        distributionMintKeypair,
        ownerKeypair,
        0
    )

    console.log("Creating mints...")
    await executeMintInstructions(
        connection,
        mintInstructions,
        [
            limitedPartnerMintKeypair,
            delegateMintKeypair,
            distributionMintKeypair
        ],
        ownerKeypair
    )

    console.log("Creating delegate's delegate mint ATA...")
    await createDelegateAssociatedTokenAccount(
        connection,
        ownerKeypair,
        delegateKeypair,
        delegateAtaPublicKey,
        delegateMintKeypair.publicKey
    )

    console.log("Minting 1 delegate token for delegate...")
    await mintDelegateTokenForDelegate(
        connection,
        ownerKeypair,
        delegateMintKeypair.publicKey,
        delegateAtaPublicKey
    )

    console.log("Creating realm...")
    const realmPublicKey = await createRealm(
        connection,
        governanceProgramIdPublicKey,
        ownerKeypair,
        delegateMintKeypair.publicKey,
        limitedPartnerMintKeypair.publicKey,
        name
    )

    console.log("Depositing delegate's delegate token for governance...")
    await depositDelegateCouncilTokenInGovernance(
        connection,
        governanceProgramIdPublicKey,
        delegateKeypair,
        realmPublicKey,
        delegateAtaPublicKey,
        delegateMintKeypair.publicKey
    )

    console.log("Transferring mints to governance...")
    let {
        limitedPartnerMintGovernancePublicKey,
        delegateMintGovernancePublicKey,
        distributionMintGovernancePublicKey
    } = await transferMintsToGovernance(
        connection,
        governanceProgramIdPublicKey,
        governanceConfig,
        ownerKeypair,
        realmPublicKey,
        delegateMintKeypair.publicKey,
        limitedPartnerMintKeypair.publicKey,
        distributionMintKeypair.publicKey
    )


    console.log("Assign limited partner governance to realm...")
    await assignLimitedPartnerGovernanceToRealm(
        connection,
        governanceProgramIdPublicKey,
        ownerKeypair,
        realmPublicKey,
        limitedPartnerMintGovernancePublicKey
    )

    console.log("Creating USDC ATA for distribution governance...")
    const distributionUsdcAtaPublicKey = await createUsdTreasuryAccount(
        connection,
        ownerKeypair,
        usdcMintPublicKey,
        distributionMintGovernancePublicKey
    )

    console.log("Creating USDC ATA for limited partner governance...")
    const limitedPartnerUsdcAtaPublicKey = await createUsdTreasuryAccount(
        connection,
        ownerKeypair,
        usdcMintPublicKey,
        limitedPartnerMintGovernancePublicKey
    )


    console.log();
    console.log("Output:")
    console.log();
    console.log(`limited Partner Mint: ${limitedPartnerMintKeypair.publicKey.toBase58()}`);
    console.log(`Delegate Mint: ${delegateMintKeypair.publicKey.toBase58()}`);
    console.log(`Distribution Mint: ${distributionMintKeypair.publicKey.toBase58()}`);
    console.log(`Delegate's ATA: ${delegateAtaPublicKey.toBase58()}`);
    console.log(`Realm: ${realmPublicKey}`);
    console.log(`Limited Partner Mint Governance: ${limitedPartnerMintGovernancePublicKey}`);
    console.log(`Distribution Mint Governance: ${distributionMintGovernancePublicKey}`);
    console.log(`Delegate Mint Governance: ${delegateMintGovernancePublicKey}`);
    console.log(`Distribution USDC ATA: ${distributionUsdcAtaPublicKey}`);
    console.log(`Limited Partner USDC ATA: ${limitedPartnerUsdcAtaPublicKey}`);
    console.log();

    console.log("Complete.")


}

const updateLocalConfig = async (
    ownerKeyPair: string,
    cluster: string
) => {

    await exec(`
        solana config set 
        -k ${ownerKeyPair}
        -u ${cluster}
    `, {capture: true, echo: false});

}

const createMintInstructions = async (
    instructions: TransactionInstruction[],
    connection: Connection,
    mintKeypair: Keypair,
    ownerKeypair: Keypair,
    decimals: number
) => {

    const mintRentExempt = await connection.getMinimumBalanceForRentExemption(
        MintLayout.span
    )

    const createAccountTransactionInstruction = SystemProgram.createAccount({
        fromPubkey: ownerKeypair.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        lamports: mintRentExempt,
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID
    })

    const createMintTransactionInstruction = createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        ownerKeypair.publicKey, null
    )

    instructions.push(
        createAccountTransactionInstruction,
        createMintTransactionInstruction
    )

}

const executeMintInstructions = async (
    connection: Connection,
    instructions: TransactionInstruction[],
    mintKeypairs: Keypair[],
    ownerKeypair: Keypair
) => {

    const mintTransaction = new Transaction();

    mintTransaction.add(...instructions)
    mintTransaction.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(
        connection,
        mintTransaction,
        [...mintKeypairs, ownerKeypair],
    )

    return true

}

const createDelegateAssociatedTokenAccount = async (
    connection: Connection,
    ownerKeypair: Keypair,
    delegateKeypair: Keypair,
    delegateAtaPublicKey: PublicKey,
    councilMintAddress: PublicKey
) => {

    const ataTransactionInstruction = createAssociatedTokenAccountInstruction(
        ownerKeypair.publicKey,
        delegateAtaPublicKey,
        delegateKeypair.publicKey,
        councilMintAddress,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    )

    const ataTransaction = new Transaction()

    // ataTransaction.add(createAccountTransactionInstruction)
    ataTransaction.add(ataTransactionInstruction)
    ataTransaction.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(
        connection,
        ataTransaction,
        [ownerKeypair],
    )

}

const mintDelegateTokenForDelegate = async (
    connection: Connection,
    ownerKeypair: Keypair,
    councilMintPubkey: PublicKey,
    delegateAtaPubKey: PublicKey
) => {

    const mintToTransactionInstruction = createMintToInstruction(
        councilMintPubkey,
        delegateAtaPubKey,
        ownerKeypair.publicKey,
        1
    )

    const mintToTransaction = new Transaction()

    mintToTransaction.add(mintToTransactionInstruction)
    mintToTransaction.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(
        connection,
        mintToTransaction,
        [ownerKeypair],
    )

}

const createRealm = async (
    connection: Connection,
    governanceProgramId: PublicKey,
    ownerKeypair: Keypair,
    councilMintPublicKey: PublicKey,
    communityMintPublicKey: PublicKey,
    name: string,
) => {

    let transactionInstructions: TransactionInstruction[] = []

    const minCommunityWeightToCreateGovernance = new BN(LAMPORTS_PER_SOL * 1000000);

    const realmAddress = await withCreateRealm(
        transactionInstructions,
        governanceProgramId,
        2,
        name,
        ownerKeypair.publicKey,
        communityMintPublicKey,
        ownerKeypair.publicKey,
        councilMintPublicKey,
        MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION,
        minCommunityWeightToCreateGovernance
    )

    const tx = new Transaction();

    tx.add(...transactionInstructions);
    tx.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair])

    return realmAddress

}

const createUsdTreasuryAccount = async (
    connection: Connection,
    ownerKeypair: Keypair,
    usdcMintPublicKey: PublicKey,
    governancePublicKey: PublicKey
) => {

    const usdcAtaPublicKey = (await PublicKey.findProgramAddress(
        [
            governancePublicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            usdcMintPublicKey.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];

    const transactionInstruction = createAssociatedTokenAccountInstruction(
        ownerKeypair.publicKey,
        usdcAtaPublicKey,
        governancePublicKey,
        usdcMintPublicKey
    )

    const tx = new Transaction();

    tx.add(transactionInstruction);
    tx.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair])

    return usdcAtaPublicKey;

}

const depositDelegateCouncilTokenInGovernance = async (
    connection: Connection,
    governanceProgramId: PublicKey,
    delegateKeypair: Keypair,
    realmPublicKey: PublicKey,
    delegateAtaPublicKey: PublicKey,
    councilMintPublicKey: PublicKey,
) => {

    let instruction: TransactionInstruction[] = [];

    await withDepositGoverningTokens(
        instruction,
        governanceProgramId,
        2, // why does program 2 work and not program 1
        realmPublicKey,
        delegateAtaPublicKey,
        councilMintPublicKey,
        delegateKeypair.publicKey,
        delegateKeypair.publicKey,
        delegateKeypair.publicKey,
        new BN(1)
    )

    const tx = new Transaction();

    tx.add(...instruction);
    tx.feePayer = delegateKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [delegateKeypair])

}

const transferMintsToGovernance = async (
    connection: Connection,
    governanceProgramId: PublicKey,
    governanceConfig: any,
    ownerKeypair: Keypair,
    realmPublicKey: PublicKey,
    delegateMintPublicKey: PublicKey,
    limitedPartnerMintPublicKey: PublicKey,
    distributionMintPublicKey: PublicKey
) => {

    const [tokenOwnerRecordAddress] = await PublicKey.findProgramAddress(
        [
            governanceProgramId.toBuffer(),
            realmPublicKey.toBuffer(),
            delegateMintPublicKey.toBuffer(),
            ownerKeypair.publicKey.toBuffer(),
        ],
        governanceProgramId,
    );


    // Put limited partner and council mints under the realm governance with default config
    const config = new GovernanceConfig({
        voteThresholdPercentage: new VoteThresholdPercentage({
            value: governanceConfig.voteThresholdPercentage,
        }),
        minCommunityTokensToCreateProposal: new BN(governanceConfig.minCommunityTokensToCreateProposal),
        minInstructionHoldUpTime: governanceConfig.minInstructionHoldUpTime,
        maxVotingTime: governanceConfig.maxVotingTime,
        voteTipping: governanceConfig.voteTipping,
        proposalCoolOffTime: governanceConfig.proposalCoolOffTime,
        minCouncilTokensToCreateProposal: new BN(governanceConfig.minCouncilTokensToCreateProposal),
    });

    const instructions: TransactionInstruction[] = []

    const limitedPartnerMintGovernancePublicKey = await withCreateMintGovernance(
        instructions,
        governanceProgramId,
        2, // why does program 2 work and not program 1
        realmPublicKey,
        limitedPartnerMintPublicKey,
        config,
        !!ownerKeypair.publicKey,
        ownerKeypair.publicKey,
        tokenOwnerRecordAddress,
        ownerKeypair.publicKey,
        ownerKeypair.publicKey
    )

    const delegateMintGovernancePublicKey = await withCreateMintGovernance(
        instructions,
        governanceProgramId,
        2,  // why does program 2 work and not program 1
        realmPublicKey,
        delegateMintPublicKey,
        config,
        !!ownerKeypair.publicKey,
        ownerKeypair.publicKey,
        tokenOwnerRecordAddress,
        ownerKeypair.publicKey,
        ownerKeypair.publicKey
    )

    const distributionMintGovernancePublicKey = await withCreateMintGovernance(
        instructions,
        governanceProgramId,
        2,  // why does program 2 work and not program 1
        realmPublicKey,
        distributionMintPublicKey,
        config,
        !!ownerKeypair.publicKey,
        ownerKeypair.publicKey,
        tokenOwnerRecordAddress,
        ownerKeypair.publicKey,
        ownerKeypair.publicKey
    )

    const tx = new Transaction();

    tx.add(...instructions);
    tx.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair])

    return {
        limitedPartnerMintGovernancePublicKey,
        delegateMintGovernancePublicKey,
        distributionMintGovernancePublicKey
    }

}

const assignLimitedPartnerGovernanceToRealm = async (
    connection: Connection,
    governanceProgramId: PublicKey,
    ownerKeypair: Keypair,
    realmPublicKey: PublicKey,
    communityMintGovernancePublicKey: PublicKey
) => {

    const instructions: TransactionInstruction[] = []

    withSetRealmAuthority(
        instructions,
        governanceProgramId,
        2,
        realmPublicKey,
        ownerKeypair.publicKey,
        communityMintGovernancePublicKey,
        1
    )

    const tx = new Transaction();

    tx.add(...instructions);
    tx.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair])

}

// helpers

async function exec(command: string, {
    capture = false,
    echo = false,
    cwd = process.cwd()
} = {}): Promise<{ data: string, code: string }> {

    let parsedCommand = command.replace(/\\?\n/g, ''); // need to merge multi-line commands into one string

    if (echo) {
        console.log(parsedCommand);
    }

    const childProcess = spawn(
        'bash',
        ['-c', parsedCommand],
        {
            stdio: capture ? 'pipe' : 'inherit',
            cwd: cwd
        }
    );

    return new Promise((resolve, reject) => {
        // return new Promise<{code: number, data: string}>((resolve, reject) => {

        let stdout = '';

        if (capture) {
            childProcess.stdout?.on('data', (data: any) => {
                stdout += data ?? "";
            });
        }

        childProcess.on('error', (error: any) => {
            reject({code: 1, error: error});
        });

        childProcess.on('close', (code: string) => {
            if (code ?? 0 > 0) {
                reject({code: code ?? 0, error: 'Command failed with code ' + code});
            } else {
                resolve({code: code ?? 0, data: stdout.trim()});
            }
        });

    });
}

async function loadKeypair(fileRef: string) {

    let filePath = fileRef;

    if (filePath[0] === '~') {
        filePath = path.join(process.env.HOME!, filePath.slice(1));
    }

    let contents = fs.readFileSync(`${filePath}`);

    let parsed = String(contents)
        .replace("[", "")
        .replace("]", "")
        .split(",")
        .map((item) => Number(item))

    const uint8Array = Uint8Array.from(parsed);

    return Keypair.fromSecretKey(uint8Array);

}

const validateConfig = (config: any) => {

    return !!(
        isString(config.cluster) &&
        isString(config.owner) &&
        isString(config.delegate) &&
        isString(config.name) &&
        isString(config.governanceProgramId) &&
        isString(config.usdcMint) &&
        isNumber(config.governance.voteThresholdPercentage) &&
        isNumber(config.governance.minCommunityTokensToCreateProposal) &&
        isNumber(config.governance.minInstructionHoldUpTime) &&
        isNumber(config.governance.maxVotingTime) &&
        isNumber(config.governance.voteTipping) &&
        isNumber(config.governance.proposalCoolOffTime) &&
        isNumber(config.governance.minCouncilTokensToCreateProposal)
    );

}