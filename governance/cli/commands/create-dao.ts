import {spawn} from "child_process";
import BN from "bn.js";
import {
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    Connection,
    sendAndConfirmTransaction
} from "@solana/web3.js"

import {
    getTokenOwnerRecordAddress,
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
const GOVERNANCE_PROGRAM_SEED = 'governance';
const SYSVAR_RENT_PUBKEY = new PublicKey('SysvarRent111111111111111111111111111111111');
const SECONDS_PER_DAY = 86400;

export const createDao = async (
    delegateKeypair: string,
    ownerKeyPair: string,
    cluster: string,
    name: string
) => {

    console.log();
    console.log("Input:")
    console.log();
    console.log(`Delegate Keypair: ${delegateKeypair}`);
    console.log(`Owner Keypair: ${ownerKeyPair}`);
    console.log(`Cluster Endpoint: ${cluster}`);
    console.log(`DAO Name: ${name}`);
    console.log();

    console.log("Starting.");
    console.log();

    await updateLocalConfig(ownerKeyPair, cluster);

    const communityMintAddress = await createCommunityMint();
    const councilMintAddress = await createCouncilMint();
    const delegateAtaAddress = await createDelegateAssociatedTokenAccount(
        delegateKeypair,
        councilMintAddress
    );

    await mintCouncilTokenForDelegate(
        councilMintAddress,
        delegateAtaAddress
    );

    const realmPublicKey = await createRealm(
        cluster,
        ownerKeyPair,
        councilMintAddress,
        communityMintAddress,
        name
    )

    await depositDelegateCouncilTokenInGovernance(
        cluster,
        delegateKeypair,
        realmPublicKey,
        delegateAtaAddress,
        councilMintAddress
    )

    let {communityMintGovPk, councilMintGovPk} = await transferCommunityAndCouncilMintToGovernance(
        cluster,
        ownerKeyPair,
        realmPublicKey,
        councilMintAddress,
        communityMintAddress
    )


    await assignCommunityGovernanceToRealm(cluster, ownerKeyPair,realmPublicKey, communityMintGovPk)

    console.log();
    console.log("Output:")
    console.log();
    console.log(`Community Mint: ${communityMintAddress}`);
    console.log(`Council Mint: ${councilMintAddress}`);
    console.log(`Delegate ATA: ${delegateAtaAddress}`);
    console.log(`Realm: ${realmPublicKey}`);
    console.log(`Community Mint Governance: ${communityMintGovPk}`);
    console.log(`Council Mint Governance: ${councilMintGovPk}`);
    console.log();

    console.log("Complete.")
}

const updateLocalConfig = async (ownerKeyPair: string, cluster: string) => {

    console.log("Updating local solana configuration...")

    await exec(`
        solana config set 
        -k ${ownerKeyPair}
        -u ${cluster}
    `, {capture: true, echo: false});

}

const createCommunityMint = async () => {

    console.log("Creating community mint...")

    const communityMintAddressOutput = await exec(`
        spl-token \
            create-token
            --verbose
            --decimals 6
    `, {capture: true, echo: false})

    return communityMintAddressOutput.data.match(".*(?:Creating token)(.*)")![1].trim();

}

const createCouncilMint = async () => {

    console.log("Creating council mint...")

    const councilMintAddressOutput = await exec(`
        spl-token \
            create-token
            --verbose
            --decimals 0
    `, {capture: true, echo: false})

    return councilMintAddressOutput.data.match(".*(?:Creating token)(.*)")![1].trim()

}

const createDelegateAssociatedTokenAccount = async (delegateKeypair: string, councilMintAddress: string) => {

    console.log("Creating delegate's council mint ATA...")

    let delegateCouncilTokenAccountOutput: any

    try {

        delegateCouncilTokenAccountOutput = await exec(`
            spl-token create-account 
                --owner ${delegateKeypair}
                ${councilMintAddress}
        `, {capture: true, echo: false});

    } catch (error) {

        console.log(error);

    }

    return delegateCouncilTokenAccountOutput.data.match(".*(?:Creating account)(.*)")![1].trim();

}

const mintCouncilTokenForDelegate = async (councilMintAddress: string, delegateAtaAddress: string) => {

    console.log("Minting 1 council token for delegate...")

    return await exec(`
        spl-token mint 
        ${councilMintAddress} 
        1
        ${delegateAtaAddress}
    `, {capture: true, echo: false});

}

const createRealm = async (
    cluster: string,
    owner: string,
    councilMint: string,
    communityMint: string,
    name: string,
) => {

    console.log("Creating realm...")

    const ownerKeypair = await loadKeypair(owner);
    const councilMintPublicKey = new PublicKey(councilMint);
    const communityMintPublicKey = new PublicKey(communityMint);
    const minCommunityWeightToCreateGovernance = new BN(100);

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

    console.log()
    console.log("Accounts:")
    console.log()

    console.log(`0. Governance Realm account:        ${realmAddress.toBase58()}`)
    console.log(`1. Realm Authority:                 ${ownerKeypair.publicKey.toBase58()}`)
    console.log(`2. Community Token Mint:            ${communityMintPublicKey.toBase58()}`)
    console.log(`3. Community Token Holding Address: ${communityTokenHoldingAddress.toBase58()}`)
    console.log(`4. Payer:                           ${ownerKeypair.publicKey.toBase58()}`)
    console.log(`5. System:                          ${SYSTEM_PROGRAM_ID.toBase58()}`)
    console.log(`6. SPL Token:                       ${TOKEN_PROGRAM_ID.toBase58()}`)
    console.log(`7. Sysvar Rent:                     ${SYSVAR_RENT_PUBKEY.toBase58()}`)
    console.log(`8. Council Token Mint:              ${councilMintPublicKey.toBase58()}`)
    console.log(`9. Council Token Holding Address:   ${councilTokenHoldingAddress.toBase58()}`)

    console.log()

    let keys = [
        // 0. `[writable]` Governance Realm account. PDA seeds:['governance',name]
        {pubkey: realmAddress, isSigner: false, isWritable: true},
        // 1. `[]` Realm authority
        {pubkey: ownerKeypair.publicKey, isSigner: false, isWritable: false},
        // 2. `[]` Community Token Mint
        {pubkey: communityMintPublicKey, isSigner: false, isWritable: false},
        // 3. `[writable]` Community Token Holding account. PDA seeds: ['governance',realm,community_mint]
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

    const connection = new Connection(cluster)

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair], {
        skipPreflight: true
    })

    return realmAddress.toBase58()

}

const depositDelegateCouncilTokenInGovernance = async (
    cluster: string,
    delegate: string,
    realm: string,
    delegateAta: string,
    councilMint: string,
) => {

    console.log("Depositing delegate council token for governance...")

    const delegateKeypair = await loadKeypair(delegate);
    const realmPublicKey = new PublicKey(realm);
    const delegateAtaPublicKey = new PublicKey(delegateAta);
    const councilMintPublicKey = new PublicKey(councilMint);

    let instruction: TransactionInstruction[] = [];

    await withDepositGoverningTokens(
        instruction,
        GOVERNANCE_PROGRAM_ID,
        2,
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

    const connection = new Connection(cluster)

    await sendAndConfirmTransaction(connection, tx, [delegateKeypair], {
        skipPreflight: true
    })

}

const transferCommunityAndCouncilMintToGovernance = async (
    cluster: string,
    owner: string,
    realm: string,
    councilMint: string,
    communityMint: string,
) => {

    console.log("Transferring community and council mint to governance...")

    const ownerKeypair = await loadKeypair(owner);
    const realmPublicKey = new PublicKey(realm);
    const councilMintPublicKey = new PublicKey(councilMint);
    const communityMintPublicKey = new PublicKey(communityMint);

    const [tokenOwnerRecordAddress] = await PublicKey.findProgramAddress(
        [
            Buffer.from(GOVERNANCE_PROGRAM_SEED),
            realmPublicKey.toBuffer(),
            councilMintPublicKey.toBuffer(),
            ownerKeypair.publicKey.toBuffer(),
        ],
        GOVERNANCE_PROGRAM_ID,
    );

    // Put community and council mints under the realm governance with default config
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

    const instructions:TransactionInstruction[] = []

    const communityMintGovPk = await withCreateMintGovernance(
        instructions,
        GOVERNANCE_PROGRAM_ID,
        2,
        realmPublicKey,
        communityMintPublicKey,
        config,
        !!ownerKeypair.publicKey,
        ownerKeypair.publicKey,
        tokenOwnerRecordAddress,
        ownerKeypair.publicKey,
        ownerKeypair.publicKey
    )

    const councilMintGovPk = await withCreateMintGovernance(
        instructions,
        GOVERNANCE_PROGRAM_ID,
        2,
        realmPublicKey,
        councilMintPublicKey,
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

    const connection = new Connection(cluster)

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair], {
        skipPreflight: true
    })

    return {
        communityMintGovPk: communityMintGovPk.toBase58(),
        councilMintGovPk: councilMintGovPk.toBase58()
    }

}

const assignCommunityGovernanceToRealm = async (
    cluster: string,
    owner: string,
    realm: string,
    communityMintGovernance: string
) => {

    console.log("Assign community governance to realm...")

    const ownerKeypair = await loadKeypair(owner);
    const realmPublicKey = new PublicKey(realm);
    const communityMintGovernancePublicKey = new PublicKey(communityMintGovernance);

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

    const connection = new Connection(cluster)

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair], {
        skipPreflight: true
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