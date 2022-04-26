import {spawn} from "child_process";
import BN from "bn.js";
import {
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    Connection,
    sendAndConfirmTransaction,
    SystemProgram,
    LAMPORTS_PER_SOL
} from "@solana/web3.js"

import {
    Mint,
    createMintToInstruction,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createInitializeMintInstruction,
    createInitializeAccountInstruction,
    createAccount,
    initializeAccountInstructionData, MintLayout
} from "@solana/spl-token"

import {
    GovernanceConfig,
    VoteThresholdPercentage,
    MintMaxVoteWeightSource,
    RealmConfigArgs,
    VoteTipping
} from "../../js/src/governance/accounts"
import {CreateRealmArgs} from "../../js/src/governance/instructions";
import {getGovernanceSchema} from "../../js/src/governance/serialisation";
import {withDepositGoverningTokens} from '../../js/src/governance/withDepositGoverningTokens'
import {withCreateMintGovernance} from '../../js/src/governance/withCreateMintGovernance'
import {withSetRealmAuthority} from '../../js/src/governance/withSetRealmAuthority'
import {serialize} from 'borsh';
import * as fs from "fs";
import path from "path";

const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
const GOVERNANCE_PROGRAM_ID = new PublicKey('7cjMfQWdJ9Va2pjSZM3D9G2PGCwgWMzbgcaVymCtRVQZ');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
const GOVERNANCE_PROGRAM_SEED = 'governance';
const SYSVAR_RENT_PUBKEY = new PublicKey('SysvarRent111111111111111111111111111111111');
const SECONDS_PER_DAY = 86400;
const SKIP_PREFLIGHT = false;
const USDC_TOKEN = new PublicKey("91TqzrHZe6QotBk9ohR4cYmJEZ89ZNAYCc2Jp8Jbbmvg");

export const createDao = async (
    delegate: string,
    owner: string,
    cluster: string,
    name: string,
    usdcMint: string
) => {

    console.log();
    console.log("Input:")
    console.log();
    console.log(`Delegate Keypair: ${delegate}`);
    console.log(`Owner Keypair: ${owner}`);
    console.log(`Cluster Endpoint: ${cluster}`);
    console.log(`DAO Name: ${name}`);
    console.log();

    await updateLocalConfig(owner, cluster);

    const connection = new Connection(cluster)
    const ownerKeypair = await loadKeypair(owner);
    const delegateKeypair = await loadKeypair(delegate);
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

    console.log("Starting.");
    console.log();

    console.log("Creating limited partner mint...")
    await createMint(
        connection,
        limitedPartnerMintKeypair,
        ownerKeypair, 0
    )

    console.log("Creating delegate mint...")
    await createMint(
        connection,
        delegateMintKeypair,
        ownerKeypair, 0
    )

    console.log("Creating distribution mint...")
    await createMint(
        connection,
        distributionMintKeypair,
        ownerKeypair, 0
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

    console.log("Creating treasury accounts...")
    await createUsdcTreasuryAccounts(
        connection,
        usdcMintPublicKey,
        delegateMintKeypair.publicKey,
        distributionMintKeypair.publicKey
    )

    console.log("Creating realm...")
    const realmPublicKey = await createRealm(
        connection,
        ownerKeypair,
        delegateMintKeypair.publicKey,
        limitedPartnerMintKeypair.publicKey,
        name
    )

    console.log("Depositing delegate's delegate token for governance...")
    await depositDelegateCouncilTokenInGovernance(
        connection,
        delegateKeypair,
        realmPublicKey,
        delegateAtaPublicKey,
        delegateMintKeypair.publicKey
    )

    console.log("Transferring mints to governance...")
    let {
        communityMintGovernancePublicKey,
        councilMintGovernancePublicKey,
        distributionMintGovernancePublicKey
    } = await transferMintsToGovernance(
        connection,
        ownerKeypair,
        realmPublicKey,
        delegateMintKeypair.publicKey,
        limitedPartnerMintKeypair.publicKey,
        distributionMintKeypair.publicKey
    )

    console.log("Assign limited partner governance to realm...")
    await assignLimitedPartnerGovernanceToRealm(
        connection,
        ownerKeypair,
        realmPublicKey,
        communityMintGovernancePublicKey
    )

    console.log();
    console.log("Output:")
    console.log();
    console.log(`limited Partner Mint: ${limitedPartnerMintKeypair.publicKey.toBase58()}`);
    console.log(`Delegate Mint: ${delegateMintKeypair.publicKey.toBase58()}`);
    console.log(`Distribution Mint: ${distributionMintKeypair.publicKey.toBase58()}`);
    console.log(`Delegate's ATA: ${delegateAtaPublicKey.toBase58()}`);
    console.log(`Realm: ${realmPublicKey}`);
    console.log(`Limited Partner Mint Governance: ${communityMintGovernancePublicKey}`);
    console.log(`Distribution Mint Governance: ${distributionMintGovernancePublicKey}`);
    console.log(`Delegate Mint Governance: ${councilMintGovernancePublicKey}`);
    console.log();

    console.log("Complete.")


}

const updateLocalConfig = async (
    ownerKeyPair: string,
    cluster: string
) => {

    console.log("Updating local solana configuration...")

    await exec(`
        solana config set 
        -k ${ownerKeyPair}
        -u ${cluster}
    `, {capture: true, echo: false});

}


const createMint = async (
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

    const mintTransaction = new Transaction();

    mintTransaction.add(createAccountTransactionInstruction)
    mintTransaction.add(createMintTransactionInstruction)
    mintTransaction.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(
        connection,
        mintTransaction,
        [mintKeypair, ownerKeypair],
        {
            skipPreflight: SKIP_PREFLIGHT
        }
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
        {
            skipPreflight: SKIP_PREFLIGHT
        }
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
        {
            skipPreflight: SKIP_PREFLIGHT
        }
    )

}

const createRealm = async (
    connection: Connection,
    ownerKeypair: Keypair,
    councilMintPublicKey: PublicKey,
    communityMintPublicKey: PublicKey,
    name: string,
) => {

    const minCommunityWeightToCreateGovernance = new BN(LAMPORTS_PER_SOL * 1000000);

    const configArgs = new RealmConfigArgs({
        useCouncilMint: true,
        minCommunityTokensToCreateGovernance: minCommunityWeightToCreateGovernance,
        communityMintMaxVoteWeightSource: MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION,
        useCommunityVoterWeightAddin: false,
        useMaxCommunityVoterWeightAddin: false,
    });

    const args = new CreateRealmArgs({configArgs, name});
    const data = Buffer.from(serialize(getGovernanceSchema(2), args));

    const [realmAddress] = await PublicKey.findProgramAddress(
        [
            Buffer.from(GOVERNANCE_PROGRAM_SEED),
            Buffer.from(args.name)
        ],
        GOVERNANCE_PROGRAM_ID,
    );

    const [communityTokenHoldingAddress] = await PublicKey.findProgramAddress(
        [
            Buffer.from(GOVERNANCE_PROGRAM_SEED),
            realmAddress.toBuffer(),
            communityMintPublicKey.toBuffer(),
        ],
        GOVERNANCE_PROGRAM_ID,
    );

    const [councilTokenHoldingAddress] = await PublicKey.findProgramAddress(
        [
            Buffer.from(GOVERNANCE_PROGRAM_SEED),
            realmAddress.toBuffer(),
            councilMintPublicKey.toBuffer(),
        ],
        GOVERNANCE_PROGRAM_ID,
    );

    let keys = [
        // 0. `[writable]` Governance Realm account. PDA seeds:['governance',name]
        {pubkey: realmAddress, isSigner: false, isWritable: true},
        // 1. `[]` Realm authority
        {pubkey: ownerKeypair.publicKey, isSigner: false, isWritable: false},
        // 2. `[]` limited partnerToken Mint
        {pubkey: communityMintPublicKey, isSigner: false, isWritable: false},
        // 3. `[writable]` limited partnerToken Holding account. PDA seeds: ['governance',realm,community_mint]
        {pubkey: communityTokenHoldingAddress, isSigner: false, isWritable: true},
        // 4. `[signer]` Payer
        {pubkey: ownerKeypair.publicKey, isSigner: true, isWritable: true},
        // 5. `[]` System
        {pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false},
        // 6. `[]` SPL Token
        {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
        // 7. `[]` Sysvar Rent
        {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
        // 8. `[]` Council Token Mint - optional
        {pubkey: councilMintPublicKey, isSigner: false, isWritable: false},
        // 9. `[writable]` Council Token Holding account - optional unless council is used. PDA seeds: ['governance',realm,council_mint]
        {pubkey: councilTokenHoldingAddress, isSigner: false, isWritable: true}
    ];

    const txi = new TransactionInstruction({
        keys,
        programId: GOVERNANCE_PROGRAM_ID,
        data,
    })

    const tx = new Transaction();

    tx.add(txi);
    tx.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair], {
        skipPreflight: SKIP_PREFLIGHT
    })

    return realmAddress

}

const createUsdcTreasuryAccounts = async (
    connection: Connection,
    usdcMint: PublicKey,
    delegateGovernance: PublicKey,
    distributionGovernance: PublicKey,
) => {

    // create 2 usdc accounts and ties them to the council
    // pda for lp token account

    // withCreateAssociatedTokenAccount()
    //
    // const liquidityAtaPublicKey = (await PublicKey.findProgramAddress(
    //     [
    //         liquidityUsdcPublicKey.toBuffer(),
    //         TOKEN_PROGRAM_ID.toBuffer(),
    //         usdcMint.toBuffer(),
    //     ],
    //     ASSOCIATED_TOKEN_PROGRAM_ID
    // ))[0];
    //
    // const distributionAtaPublicKey = (await PublicKey.findProgramAddress(
    //     [
    //         distributionUsdcPublicKey.toBuffer(),
    //         TOKEN_PROGRAM_ID.toBuffer(),
    //         governancePublicKey.toBuffer(),
    //     ],
    //     ASSOCIATED_TOKEN_PROGRAM_ID
    // ))[0];
    //
    // console.log("liquidityAtaPublicKey", liquidityAtaPublicKey);
    // console.log("distributionAtaPublicKey", distributionAtaPublicKey);

}

const depositDelegateCouncilTokenInGovernance = async (
    connection: Connection,
    delegateKeypair: Keypair,
    realmPublicKey: PublicKey,
    delegateAtaPublicKey: PublicKey,
    councilMintPublicKey: PublicKey,
) => {

    let instruction: TransactionInstruction[] = [];

    await withDepositGoverningTokens(
        instruction,
        GOVERNANCE_PROGRAM_ID,
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

    await sendAndConfirmTransaction(connection, tx, [delegateKeypair], {
        skipPreflight: SKIP_PREFLIGHT
    })

}

const transferMintsToGovernance = async (
    connection: Connection,
    ownerKeypair: Keypair,
    realmPublicKey: PublicKey,
    councilMintPublicKey: PublicKey,
    communityMintPublicKey: PublicKey,
    distributionMintPublicKey: PublicKey
) => {

    const [tokenOwnerRecordAddress] = await PublicKey.findProgramAddress(
        [
            Buffer.from(GOVERNANCE_PROGRAM_SEED),
            realmPublicKey.toBuffer(),
            councilMintPublicKey.toBuffer(),
            ownerKeypair.publicKey.toBuffer(),
        ],
        GOVERNANCE_PROGRAM_ID,
    );

    // Put limited partner and council mints under the realm governance with default config
    const config = new GovernanceConfig({
        voteThresholdPercentage: new VoteThresholdPercentage({
            value: 100,
        }),
        minCommunityTokensToCreateProposal: new BN(10000),
        // Do not use instruction hold up time
        minInstructionHoldUpTime: 0,
        // max voting time 3 days
        maxVotingTime: 3 * SECONDS_PER_DAY,
        voteTipping: VoteTipping.Strict,
        proposalCoolOffTime: 0,
        minCouncilTokensToCreateProposal: new BN(1),
    });

    const instructions: TransactionInstruction[] = []

    const communityMintGovernancePublicKey = await withCreateMintGovernance(
        instructions,
        GOVERNANCE_PROGRAM_ID,
        2, // why does program 2 work and not program 1
        realmPublicKey,
        communityMintPublicKey,
        config,
        !!ownerKeypair.publicKey,
        ownerKeypair.publicKey,
        tokenOwnerRecordAddress,
        ownerKeypair.publicKey,
        ownerKeypair.publicKey
    )

    const councilMintGovernancePublicKey = await withCreateMintGovernance(
        instructions,
        GOVERNANCE_PROGRAM_ID,
        2,  // why does program 2 work and not program 1
        realmPublicKey,
        councilMintPublicKey,
        config,
        !!ownerKeypair.publicKey,
        ownerKeypair.publicKey,
        tokenOwnerRecordAddress,
        ownerKeypair.publicKey,
        ownerKeypair.publicKey
    )

    const distributionMintGovernancePublicKey = await withCreateMintGovernance(
        instructions,
        GOVERNANCE_PROGRAM_ID,
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

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair], {
        skipPreflight: SKIP_PREFLIGHT
    })

    return {
        communityMintGovernancePublicKey,
        councilMintGovernancePublicKey,
        distributionMintGovernancePublicKey
    }

}

const assignLimitedPartnerGovernanceToRealm = async (
    connection: Connection,
    ownerKeypair: Keypair,
    realmPublicKey: PublicKey,
    communityMintGovernancePublicKey: PublicKey
) => {

    const instructions: TransactionInstruction[] = []

    withSetRealmAuthority(
        instructions,
        GOVERNANCE_PROGRAM_ID,
        2,
        realmPublicKey,
        ownerKeypair.publicKey,
        communityMintGovernancePublicKey,
        1
    )

    const tx = new Transaction();

    tx.add(...instructions);
    tx.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair], {
        skipPreflight: SKIP_PREFLIGHT
    })

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

    const filePath = path.join(fileRef);

    let contents = fs.readFileSync(`${filePath}`);

    let parsed = String(contents)
        .replace("[", "")
        .replace("]", "")
        .split(",")
        .map((item) => Number(item))

    const uint8Array = Uint8Array.from(parsed);

    return Keypair.fromSecretKey(uint8Array);

}