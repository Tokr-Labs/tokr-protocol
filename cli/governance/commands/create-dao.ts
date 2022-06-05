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

import {
    GovernanceConfig,
    MintMaxVoteWeightSource,
    VoteThresholdPercentage
} from "../../../programs/governance/client/src/governance/accounts"
import {withDepositGoverningTokens} from '../../../programs/governance/client/src/governance/withDepositGoverningTokens'
import {withCreateMintGovernance} from '../../../programs/governance/client/src/governance/withCreateMintGovernance'
import {withSetRealmAuthority} from '../../../programs/governance/client/src/governance/withSetRealmAuthority'
import {withCreateGovernance} from '../../../programs/governance/client/src/governance/withCreateGovernance'
import {withCreateRealm} from '../../../programs/governance/client/src/governance/withCreateRealm'
import * as fs from "fs";
import {readFileSync} from "fs";
import path from "path";
import * as process from "process";
import {validateRealmConfig} from "../../utils/validate-realm-config";
import {resolveHome} from "../../utils/resolve-home";

const skipPreflight = true;

export const createDao = async (
    configFile: string,
) => {

    const file = resolveHome(configFile);
    const configStr = readFileSync(file, {encoding: "utf8"})
    const config = JSON.parse(configStr);

    if (!validateRealmConfig(config)) {
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

    await createAndExecuteMintInstructions(
        connection,
        limitedPartnerMintKeypair,
        ownerKeypair,
        delegateMintKeypair,
        distributionMintKeypair
    )

    const realmAddress = await createAndExecuteRealmInstructions(
        connection,
        governanceProgramIdPublicKey,
        name,
        ownerKeypair,
        limitedPartnerMintKeypair,
        delegateMintKeypair
    )

    const governanceAddresses = await createAndExecuteGovernanceInstructions(
        connection,
        ownerKeypair,
        delegateMintKeypair,
        delegateKeypair,
        governanceProgramIdPublicKey,
        realmAddress,
        governanceConfig,
        limitedPartnerMintKeypair,
        distributionMintKeypair
    )

    try {

        const setLimitedPartnerTransaction = await setLimitedPartnerGovernanceAsRealmAuthority(
            connection,
            governanceProgramIdPublicKey,
            ownerKeypair,
            realmAddress,
            governanceAddresses.limitedPartnerGovernancePublicKey
        )

        console.log(setLimitedPartnerTransaction);

    } catch (error) {

        console.error(error)
        process.exit()

    }

    const treasuryAddresses = await createAndExecuteTreasuryInstructions(
        connection, ownerKeypair,
        limitedPartnerMintKeypair,
        usdcMintPublicKey,
        governanceAddresses.limitedPartnerGovernancePublicKey,
        governanceAddresses.delegateMintGovernancePublicKey,
        governanceAddresses.distributionMintGovernancePublicKey
    )

    // ============================================================
    // === Treasury ===============================================
    // ============================================================


    // ============================================================
    // === Clean Up ===============================================
    // ============================================================

    console.log("Minting max supply of LP tokens...")
    const ownerAta = await mintMaxLpTokens(
        connection,
        ownerKeypair,
        limitedPartnerMintKeypair.publicKey,
        ownerKeypair.publicKey,
        maxLpTokenSupply
    )

    console.log("Transferring LP tokens to Treasury Stock account...")
    await transfer(
        connection,
        ownerKeypair,
        ownerAta,
        treasuryAddresses.treasuryStockTreasuryPubkey,
        ownerKeypair,
        maxLpTokenSupply
    )

    console.log("Setting authority")
    await setAuthority(
        connection,
        ownerKeypair,
        limitedPartnerMintKeypair.publicKey,
        ownerKeypair,
        AuthorityType.MintTokens,
        null
    )

    console.log();
    console.log();
    console.log("OUTPUT:")
    console.log();
    console.log(`Realm: ${realmAddress}`);
    console.log()
    console.log(`LP Token Mint: ${limitedPartnerMintKeypair.publicKey.toBase58()}`);
    console.log(`Delegate Token Mint: ${delegateMintKeypair.publicKey.toBase58()}`);
    console.log(`Distribution Token Mint: ${distributionMintKeypair.publicKey.toBase58()}`);
    console.log()
    console.log(`LP Governance: ${governanceAddresses.limitedPartnerGovernancePublicKey}`);
    console.log(`LP Governed Account: ${governanceAddresses.limitedPartnerGovernedAccountPublicKey}`)
    console.log(`Delegate Mint Governance: ${governanceAddresses.delegateMintGovernancePublicKey}`);
    console.log(`Distribution Mint Governance: ${governanceAddresses.distributionMintGovernancePublicKey}`);
    console.log()
    console.log(`Capital Supply Treasury: ${treasuryAddresses.capitalSupplyTreasuryPubkey}`);
    console.log(`Treasury Stock Treasury: ${treasuryAddresses.treasuryStockTreasuryPubkey}`);
    console.log(`Distribution Treasury: ${treasuryAddresses.distributionTreasuryPubkey}`);
    console.log();

    console.log("Complete.")

}

// macros

const createAndExecuteMintInstructions = async (
    connection: Connection,
    limitedPartnerMintKeypair: Keypair,
    ownerKeypair: Keypair,
    delegateMintKeypair: Keypair,
    distributionMintKeypair: Keypair
) => {

    let mintInstructions: TransactionInstruction[] = [];

    console.log("Creating mint instructions...")

    await createMintInstructions(
        mintInstructions,
        connection,
        limitedPartnerMintKeypair,
        ownerKeypair,
        0
    )

    await createMintInstructions(
        mintInstructions,
        connection,
        delegateMintKeypair,
        ownerKeypair,
        0
    )

    await createMintInstructions(
        mintInstructions,
        connection,
        distributionMintKeypair,
        ownerKeypair,
        0
    )

    const mintTransaction = new Transaction()
    mintTransaction.feePayer = ownerKeypair.publicKey;
    mintTransaction.add(...mintInstructions)

    console.log("Executing mint transactions...")

    try {

        const mintTransactionSignature = await sendAndConfirmTransaction(
            connection,
            mintTransaction,
            [
                limitedPartnerMintKeypair,
                delegateMintKeypair,
                distributionMintKeypair,
                ownerKeypair
            ],
            {
                skipPreflight
            }
        )

        console.log(`Mint Transaction Signature: ${mintTransactionSignature}.`)

    } catch (error) {

        console.error(error)
        process.exit()

    }

}

const createAndExecuteRealmInstructions = async (
    connection: Connection,
    governanceProgramIdPublicKey: PublicKey,
    name: string,
    ownerKeypair: Keypair,
    limitedPartnerMintKeypair: Keypair,
    delegateMintKeypair: Keypair
) => {

    const realmInstructions: TransactionInstruction[] = []

    console.log("Creating realm instruction...")

    const realmAddress = await withCreateRealm(
        realmInstructions,
        governanceProgramIdPublicKey,
        2,
        name,
        ownerKeypair.publicKey,
        limitedPartnerMintKeypair.publicKey,
        ownerKeypair.publicKey,
        delegateMintKeypair.publicKey,
        MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION,
        new BN(LAMPORTS_PER_SOL * 1000000)
    )

    const realmTransaction = new Transaction()

    realmTransaction.add(...realmInstructions)

    console.log("Executing realm transaction...")

    try {

        const createRealmInstructionSignature = await sendAndConfirmTransaction(
            connection,
            realmTransaction,
            [
                ownerKeypair
            ],
            {
                skipPreflight: skipPreflight
            }
        )

        console.log(`Create Realm Transaction Signature: ${createRealmInstructionSignature}.`)

    } catch (error) {

        console.error(error)
        process.exit()

    }

    return realmAddress

}

const createAndExecuteGovernanceInstructions = async (
    connection: Connection,
    ownerKeypair: Keypair,
    delegateMintKeypair: Keypair,
    delegateKeypair: Keypair,
    governanceProgram: PublicKey,
    realmAddress: PublicKey,
    governanceConfig: GovernanceConfig,
    limitedPartnerMintKeypair: Keypair,
    distributionMintKeypair: Keypair
) => {

    console.log("Executing governance transaction...")

    const governanceInstructions: TransactionInstruction[] = []

    await mintDelegateTokenForDelegate(
        governanceInstructions,
        connection,
        ownerKeypair,
        delegateMintKeypair.publicKey,
        delegateKeypair
    )

    await depositDelegateCouncilTokenInGovernance(
        governanceInstructions,
        connection,
        governanceProgram,
        delegateKeypair,
        ownerKeypair,
        realmAddress,
        delegateMintKeypair.publicKey
    )

    let {
        limitedPartnerGovernedAccountPublicKey,
        limitedPartnerGovernancePublicKey,
        delegateMintGovernancePublicKey,
        distributionMintGovernancePublicKey
    } = await createGovernances(
        governanceInstructions,
        connection,
        governanceProgram,
        governanceConfig,
        ownerKeypair,
        realmAddress,
        delegateMintKeypair.publicKey,
        limitedPartnerMintKeypair.publicKey,
        distributionMintKeypair.publicKey
    )

    const governanceTransaction = new Transaction()
    governanceTransaction.feePayer = ownerKeypair.publicKey

    governanceTransaction.add(
        ...governanceInstructions,
    )

    console.log("Executing governance transaction...")

    try {

        const governanceTransactionSignature = await sendAndConfirmTransaction(
            connection,
            governanceTransaction,
            [ownerKeypair],
            {
                skipPreflight: skipPreflight
            }
        )

        console.log("Governance Transaction Signature:", governanceTransactionSignature);

    } catch (error) {
        console.error(error)
        process.exit()
    }

    return {
        limitedPartnerGovernedAccountPublicKey,
        limitedPartnerGovernancePublicKey,
        delegateMintGovernancePublicKey,
        distributionMintGovernancePublicKey
    }

}

const createAndExecuteTreasuryInstructions = async (
    connection: Connection,
    ownerKeypair: Keypair,
    limitedPartnerMintKeypair: Keypair,
    usdcMintPublicKey: PublicKey,
    limitedPartnerGovernancePublicKey: PublicKey,
    delegateMintGovernancePublicKey: PublicKey,
    distributionMintGovernancePublicKey: PublicKey
) => {

    const treasuryInstructions: TransactionInstruction[] = []

    console.log("Creating treasury instructions...")

    const capitalSupplyTreasuryPubkey = await createTreasuryAccount(
        treasuryInstructions,
        connection,
        ownerKeypair,
        usdcMintPublicKey,
        limitedPartnerGovernancePublicKey
    )

    const treasuryStockTreasuryPubkey = await createTreasuryAccount(
        treasuryInstructions,
        connection,
        ownerKeypair,
        limitedPartnerMintKeypair.publicKey,
        delegateMintGovernancePublicKey
    )

    const distributionTreasuryPubkey = await createTreasuryAccount(
        treasuryInstructions,
        connection,
        ownerKeypair,
        usdcMintPublicKey,
        distributionMintGovernancePublicKey
    )

    const treasuryTransaction = new Transaction()

    treasuryTransaction.add(
        ...treasuryInstructions,
    )

    console.log("Executing treasury transaction...")

    try {

        const treasuryTransactionSignature = await sendAndConfirmTransaction(
            connection,
            treasuryTransaction,
            [
                ownerKeypair
            ],
            {
                skipPreflight: skipPreflight
            }
        )

        console.log("Treasury Transaction Signature:", treasuryTransactionSignature);

    } catch (error) {
        console.error(error)
        process.exit()
    }

    return {
        capitalSupplyTreasuryPubkey,
        treasuryStockTreasuryPubkey,
        distributionTreasuryPubkey
    }

}

// helpers

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

    console.log(`Creating mint instruction for public key ${mintKeypair.publicKey}...`)

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

const mintDelegateTokenForDelegate = async (
    instructions: TransactionInstruction[],
    connection: Connection,
    ownerKeypair: Keypair,
    delegateMintPublicKey: PublicKey,
    delegateKeypair: Keypair
) => {

    console.log("Minting delegate token for delegate council member...")

    const delegateAta = await getOrCreateAssociatedTokenAccount(
        connection,
        ownerKeypair,
        delegateMintPublicKey,
        delegateKeypair.publicKey
    )

    instructions.push(createMintToInstruction(
        delegateMintPublicKey,
        delegateAta.address,
        ownerKeypair.publicKey,
        1
    ))

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

const createTreasuryAccount = async (
    instructions: TransactionInstruction[],
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

    const txi = createAssociatedTokenAccountInstruction(
        ownerKeypair.publicKey,
        mintAtaPublicKey,
        governancePublicKey,
        mintPublicKey
    )

    instructions.push(txi)

    return mintAtaPublicKey;

}

const depositDelegateCouncilTokenInGovernance = async (
    realmInstructions: TransactionInstruction[],
    connection: Connection,
    governanceProgramId: PublicKey,
    delegateKeypair: Keypair,
    ownerKeypair: Keypair,
    realmPublicKey: PublicKey,
    delegateMintPublicKey: PublicKey,
) => {

    console.log("Creating deposit delegate council token into realm delegate governance instruction...")

    const delegateAta = await getOrCreateAssociatedTokenAccount(
        connection,
        ownerKeypair,
        delegateMintPublicKey,
        delegateKeypair.publicKey
    )

    await withDepositGoverningTokens(
        realmInstructions,
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

}

const createGovernances = async (
    instructions: TransactionInstruction[],
    connection: Connection,
    governanceProgramId: PublicKey,
    governanceConfig: any,
    ownerKeypair: Keypair,
    realmPublicKey: PublicKey,
    delegateMintPublicKey: PublicKey,
    limitedPartnerMintPublicKey: PublicKey,
    distributionMintPublicKey: PublicKey
) => {

    console.log("Creating governances...")

    const [tokenOwnerRecordAddress] = await PublicKey.findProgramAddress(
        [
            governanceProgramId.toBuffer(),
            realmPublicKey.toBuffer(),
            delegateMintPublicKey.toBuffer(),
            ownerKeypair.publicKey.toBuffer(),
        ],
        governanceProgramId,
    );


    console.log("tokenOwnerRecordAddress", tokenOwnerRecordAddress.toBase58());

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

    const limitedPartnerGovernedAccountPublicKey = Keypair.generate().publicKey;

    const limitedPartnerGovernancePublicKey = await withCreateGovernance(
        instructions,
        governanceProgramId,
        2,
        realmPublicKey,
        limitedPartnerGovernedAccountPublicKey,
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

    return {
        limitedPartnerGovernedAccountPublicKey,
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

    return await sendAndConfirmTransaction(connection, tx, [ownerKeypair])

}

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