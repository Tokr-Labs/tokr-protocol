import {ASSOCIATED_TOKEN_PROGRAM_ID, MintLayout, Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import {BN} from 'bn.js';
import {
    GovernanceConfig,
    MintMaxVoteWeightSource,
    VoteThresholdPercentage,
    VoteTipping,
    withCreateMintGovernance,
    withCreateRealm,
    withDepositGoverningTokens,
    withSetRealmAuthority
} from '../../src';
import {requestAirdrop} from '../tools/sdk';
import {getTimestampFromDays} from '../tools/units';
import {generateSlug} from "random-word-slugs";

// const programId = new PublicKey('GTesTBiEWE32WHXXE2S4XbZvA5CrEc4xs6ZgRe895dP');
// const rpcEndpoint = clusterApiUrl('devnet');

const programId = new PublicKey('5xaMNNRZ5hKFTs45Y39ALQXVoXdrPAcRAY6cBqz1qc6R');
const rpcEndpoint = 'http://127.0.0.1:8899';

const connection = new Connection(rpcEndpoint, {
    commitment: "recent"
});

describe("capital based realm", () => {

    let ownerKeypair: Keypair;
    let delegateKeypair: Keypair;
    let governanceProgramKeypair: Keypair
    let usdcMintPublicKey = new PublicKey("3yFztHVjMawUZpEd1gckQHy4FH19ZbdS1h2SZmFKzcPj")
    let limitedPartnerMintKeypair: Keypair
    let delegateMintKeypair: Keypair;
    let distributionMintKeypair: Keypair;
    let governanceConfig: GovernanceConfig;
    let realmName: string;

    beforeAll(async () => {

        ownerKeypair = Keypair.generate();
        await requestAirdrop(connection, ownerKeypair.publicKey)
        delegateKeypair = Keypair.generate();
        await requestAirdrop(connection, delegateKeypair.publicKey)
        governanceProgramKeypair = Keypair.generate();
        limitedPartnerMintKeypair = Keypair.generate();
        delegateMintKeypair = Keypair.generate();
        distributionMintKeypair = Keypair.generate();
        realmName = generateSlug(2);

        // Crate governance over the the governance token mint
        governanceConfig = new GovernanceConfig({
            voteThresholdPercentage: new VoteThresholdPercentage({
                value: 60,
            }),
            minCommunityTokensToCreateProposal: new BN(1),
            minInstructionHoldUpTime: 0,
            maxVotingTime: getTimestampFromDays(3),
            voteTipping: VoteTipping.Strict,
            proposalCoolOffTime: 0,
            minCouncilTokensToCreateProposal: new BN(1),
        });

    });

    test("create capital based realm", async () => {

        const delegateAtaPublicKey = (await PublicKey.findProgramAddress(
            [
                delegateKeypair.publicKey.toBuffer(),
                TOKEN_PROGRAM_ID.toBuffer(),
                delegateMintKeypair.publicKey.toBuffer(),
            ],
            ASSOCIATED_TOKEN_PROGRAM_ID
        ))[0];

        let mintInstructions: TransactionInstruction[] = [];

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

        await createDelegateAssociatedTokenAccount(
            connection,
            ownerKeypair,
            delegateKeypair,
            delegateAtaPublicKey,
            delegateMintKeypair.publicKey
        )

        await mintDelegateTokenForDelegate(
            connection,
            ownerKeypair,
            delegateMintKeypair.publicKey,
            delegateAtaPublicKey
        )

        const realmPublicKey = await createRealm(
            connection,
            programId,
            ownerKeypair,
            delegateMintKeypair.publicKey,
            limitedPartnerMintKeypair.publicKey,
            realmName
        )

        await depositDelegateCouncilTokenInGovernance(
            connection,
            programId,
            delegateKeypair,
            realmPublicKey,
            delegateAtaPublicKey,
            delegateMintKeypair.publicKey
        )

        let {
            limitedPartnerMintGovernancePublicKey,
            delegateMintGovernancePublicKey,
            distributionMintGovernancePublicKey
        } = await transferMintsToGovernance(
            connection,
            programId,
            governanceConfig,
            ownerKeypair,
            realmPublicKey,
            delegateMintKeypair.publicKey,
            limitedPartnerMintKeypair.publicKey,
            distributionMintKeypair.publicKey
        )

        await assignLimitedPartnerGovernanceToRealm(
            connection,
            programId,
            ownerKeypair,
            realmPublicKey,
            limitedPartnerMintGovernancePublicKey
        )

        const distributionTreasuryPubkey = await createTreasuryAccount(
            connection,
            ownerKeypair,
            usdcMintPublicKey,
            distributionMintGovernancePublicKey
        )

        const capitalSupplyTreasuryPubkey = await createTreasuryAccount(
            connection,
            ownerKeypair,
            usdcMintPublicKey,
            limitedPartnerMintGovernancePublicKey
        )

        const treasuryStockTreasuryPubkey = await createTreasuryAccount(
            connection,
            ownerKeypair,
            limitedPartnerMintKeypair.publicKey,
            delegateMintGovernancePublicKey
        )

        console.log(`Realm: ${realmPublicKey}`);
        console.log(`Delegate's ATA: ${delegateAtaPublicKey.toBase58()}`);
        console.log(`LP Token Mint: ${limitedPartnerMintKeypair.publicKey.toBase58()}`);
        console.log(`Delegate Token Mint: ${delegateMintKeypair.publicKey.toBase58()}`);
        console.log(`Distribution Token Mint: ${distributionMintKeypair.publicKey.toBase58()}`);
        console.log(`LP Mint Governance: ${limitedPartnerMintGovernancePublicKey}`);
        console.log(`Delegate Mint Governance: ${delegateMintGovernancePublicKey}`);
        console.log(`Distribution Mint Governance: ${distributionMintGovernancePublicKey}`);
        console.log(`Capital Supply Treasury: ${capitalSupplyTreasuryPubkey}`);
        console.log(`Treasury Stock Treasury: ${treasuryStockTreasuryPubkey}`);
        console.log(`Distribution Treasury: ${distributionTreasuryPubkey}`);

    });

    test("test deposit captial", async () => {

        // withDepositCapital()

    });

});

// helper methods

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

    const createMintTransactionInstruction = Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        mintKeypair.publicKey,
        decimals,
        ownerKeypair.publicKey,
        null
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

    const ataTransactionInstruction = Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        councilMintAddress,
        delegateAtaPublicKey,
        delegateKeypair.publicKey,
        ownerKeypair.publicKey,
    )

    const ataTransaction = new Transaction()

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

    const mintToTransactionInstruction = Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        councilMintPubkey,
        delegateAtaPubKey,
        ownerKeypair.publicKey,
        [],
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

const createTreasuryAccount = async (
    connection: Connection,
    ownerKeypair: Keypair,
    mintPublicKey: PublicKey,
    governancePublicKey: PublicKey
) => {
    console.log("createTreasuryAccount::start")
    const mintAtaPublicKey = (await PublicKey.findProgramAddress(
        [
            governancePublicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mintPublicKey.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];

    const transactionInstruction = Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        governancePublicKey,
        mintPublicKey,
        mintAtaPublicKey,
        ownerKeypair.publicKey,
        ownerKeypair.publicKey
    )

    const tx = new Transaction();

    tx.add(transactionInstruction);
    tx.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair])
    console.log("createTreasuryAccount::done")

    return mintAtaPublicKey;
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
    console.log("transferMintsToGovernance::start")

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

    console.log("instructions");
    console.log(instructions);

    const tx = new Transaction();

    tx.add(...instructions);
    tx.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair])
    console.log("transferMintsToGovernance::done")

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
    console.log("assignLimitedPartnerGovernanceToRealm::start")

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
    console.log("assignLimitedPartnerGovernanceToRealm::done")

}
