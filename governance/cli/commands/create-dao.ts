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
    AuthorityType,
    createAssociatedTokenAccountInstruction,
    createInitializeMintInstruction,
    createMintToInstruction,
    getOrCreateAssociatedTokenAccount,
    MintLayout,
    mintTo,
    setAuthority,
    TOKEN_PROGRAM_ID,
    transfer
} from "@solana/spl-token"

import {GovernanceConfig, MintMaxVoteWeightSource, VoteThresholdPercentage} from "../../js/src/governance/accounts"
import {withDepositGoverningTokens} from '../../js/src/governance/withDepositGoverningTokens'
import {withCreateMintGovernance} from '../../js/src/governance/withCreateMintGovernance'
import {withSetRealmAuthority} from '../../js/src/governance/withSetRealmAuthority'
import {withCreateGovernance} from '../../js/src/governance/withCreateGovernance'
import {withCreateRealm} from '../../js/src/governance/withCreateRealm'
import * as fs from "fs";
import {readFileSync} from "fs";
import path from "path";
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
    const maxLpTokenSupply = config.maxLpTokenSupply;
    const governanceConfig = config.governance;

    console.log();
    console.log("Input:")
    console.log();
    console.log(config)
    console.log();

    console.log("Updating local solana configuration...")
    console.log();
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

    let mintInstructions: TransactionInstruction[] = [];

    console.log("Creating mint instructions for LP Token...")
    await createMintInstructions(
        mintInstructions,
        connection,
        limitedPartnerMintKeypair,
        ownerKeypair,
        0
    )

    console.log("Creating mint instructions for Delegate Token...")
    await createMintInstructions(
        mintInstructions,
        connection,
        delegateMintKeypair,
        ownerKeypair,
        0
    )

    console.log("Creating mint instructions for Distribution Token...")
    await createMintInstructions(
        mintInstructions,
        connection,
        distributionMintKeypair,
        ownerKeypair,
        0
    )

    console.log("Executing mint instructions...")
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

    console.log("Minting 1 Delegate Token to delegate...")
    await mintDelegateTokenForDelegate(
        connection,
        ownerKeypair,
        delegateMintKeypair.publicKey,
        delegateKeypair
    )

    console.log("Minting max supply of LP tokens...")
    const ownerAta = await mintMaxLpTokens(
        connection,
        ownerKeypair,
        limitedPartnerMintKeypair.publicKey,
        ownerKeypair.publicKey,
        maxLpTokenSupply
    )

    console.log("Disabling LP token mint authority...")
    await setAuthority(
        connection,
        ownerKeypair,
        limitedPartnerMintKeypair.publicKey,
        ownerKeypair,
        AuthorityType.MintTokens,
        null
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

    console.log("Depositing delegate's Delegate Token to realm...")
    await depositDelegateCouncilTokenInGovernance(
        connection,
        governanceProgramIdPublicKey,
        delegateKeypair,
        ownerKeypair,
        realmPublicKey,
        delegateMintKeypair.publicKey
    )

    console.log("Creating governances...")
    let {
        limitedPartnerGovernancePublicKey,
        delegateMintGovernancePublicKey,
        distributionMintGovernancePublicKey
    } = await createGovernances(
        connection,
        governanceProgramIdPublicKey,
        governanceConfig,
        ownerKeypair,
        realmPublicKey,
        delegateMintKeypair.publicKey,
        limitedPartnerMintKeypair.publicKey,
        distributionMintKeypair.publicKey
    )


    console.log("Setting LP governance as realm authority...")
    await setLimitedPartnerGovernanceAsRealmAuthority(
        connection,
        governanceProgramIdPublicKey,
        ownerKeypair,
        realmPublicKey,
        limitedPartnerGovernancePublicKey
    )

    console.log("Creating Capital Supply (USDC) treasury account under LP governance...")
    const capitalSupplyTreasuryPubkey = await createTreasuryAccount(
        connection,
        ownerKeypair,
        usdcMintPublicKey,
        limitedPartnerGovernancePublicKey
    )

    console.log("Creating Treasury Stock (LP Token) treasury account under Delegate Governance...")
    const treasuryStockTreasuryPubkey = await createTreasuryAccount(
        connection,
        ownerKeypair,
        limitedPartnerMintKeypair.publicKey,
        delegateMintGovernancePublicKey
    )

    console.log("Creating Distribution (USDC) treasury account under Distribution governance...")
    const distributionTreasuryPubkey = await createTreasuryAccount(
        connection,
        ownerKeypair,
        usdcMintPublicKey,
        distributionMintGovernancePublicKey
    )

    console.log("Transferring LP tokens to Treasury Stock account...")
    await transfer(
        connection,
        ownerKeypair,
        ownerAta,
        treasuryStockTreasuryPubkey,
        ownerKeypair,
        maxLpTokenSupply
    )


    console.log();
    console.log();
    console.log("OUTPUT:")
    console.log();
    console.log(`Realm: ${realmPublicKey}`);
    console.log()
    console.log(`LP Token Mint: ${limitedPartnerMintKeypair.publicKey.toBase58()}`);
    console.log(`Delegate Token Mint: ${delegateMintKeypair.publicKey.toBase58()}`);
    console.log(`Distribution Token Mint: ${distributionMintKeypair.publicKey.toBase58()}`);
    console.log()
    console.log(`LP Governance: ${limitedPartnerGovernancePublicKey}`);
    console.log(`Delegate Mint Governance: ${delegateMintGovernancePublicKey}`);
    console.log(`Distribution Mint Governance: ${distributionMintGovernancePublicKey}`);
    console.log()
    console.log(`Capital Supply Treasury: ${capitalSupplyTreasuryPubkey}`);
    console.log(`Treasury Stock Treasury: ${treasuryStockTreasuryPubkey}`);
    console.log(`Distribution Treasury: ${distributionTreasuryPubkey}`);
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

const mintDelegateTokenForDelegate = async (
    connection: Connection,
    ownerKeypair: Keypair,
    delegateMintPublicKey: PublicKey,
    delegateKeypair: Keypair
) => {

    const delegateAta = await getOrCreateAssociatedTokenAccount(
        connection,
        ownerKeypair,
        delegateMintPublicKey,
        delegateKeypair.publicKey
    )

    const mintToTransactionInstruction = createMintToInstruction(
        delegateMintPublicKey,
        delegateAta.address,
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

const mintMaxLpTokens = async (
    connection: Connection,
    payer: Keypair,
    mint: PublicKey,
    owner: PublicKey,
    amount: number
) => {

    const ownerAta = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        owner
    )

    await mintTo(
        connection,
        payer,
        mint,
        ownerAta.address,
        owner,
        amount
    )

    return ownerAta.address

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

const createTreasuryAccount = async (
    connection: Connection,
    ownerKeypair: Keypair,
    mintPublicKey: PublicKey,
    governancePublicKey: PublicKey
) => {

    const mintAtaPublicKey = (await PublicKey.findProgramAddress(
        [
            governancePublicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mintPublicKey.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];

    const transactionInstruction = createAssociatedTokenAccountInstruction(
        ownerKeypair.publicKey,
        mintAtaPublicKey,
        governancePublicKey,
        mintPublicKey
    )

    const tx = new Transaction();

    tx.add(transactionInstruction);
    tx.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair])

    return mintAtaPublicKey;

}

const depositDelegateCouncilTokenInGovernance = async (
    connection: Connection,
    governanceProgramId: PublicKey,
    delegateKeypair: Keypair,
    ownerKeypair: Keypair,
    realmPublicKey: PublicKey,
    delegateMintPublicKey: PublicKey,
) => {

    let instruction: TransactionInstruction[] = [];

    const delegateAta = await getOrCreateAssociatedTokenAccount(
        connection,
        ownerKeypair,
        delegateMintPublicKey,
        delegateKeypair.publicKey
    )

    await withDepositGoverningTokens(
        instruction,
        governanceProgramId,
        2, // why does program 2 work and not program 1
        realmPublicKey,
        delegateAta.address,
        delegateMintPublicKey,
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

const createGovernances = async (
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


    const limitedPartnerGovernancePublicKey = await withCreateGovernance(
        instructions,
        governanceProgramId,
        2,
        realmPublicKey,
        undefined,
        config,
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
        limitedPartnerGovernancePublicKey,
        delegateMintGovernancePublicKey,
        distributionMintGovernancePublicKey
    }

}

const setLimitedPartnerGovernanceAsRealmAuthority = async (
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