import {AuthorityType, getOrCreateAssociatedTokenAccount, setAuthority, transfer} from '@solana/spl-token';
import {
    Connection,
    Keypair, LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import {BN} from 'bn.js';
import {GovernanceConfig, VoteThresholdPercentage, VoteTipping} from '../../src';
import {requestAirdrop} from '../tools/sdk';
import {getTimestampFromDays} from '../tools/units';
import {generateSlug} from "random-word-slugs";
import {withDepositCapital} from "../../src/governance/withDepositCaptial";
import {
    createGovernances,
    createMintInstructions,
    createRealm,
    createTreasuryAccount,
    depositDelegateCouncilTokenInGovernance,
    executeMintInstructions,
    mintDelegateTokenForDelegate,
    mintMaxLpTokens,
    setLimitedPartnerGovernanceAsRealmAuthority,
} from "./utils/utils";
import path from "path";
import process from "process";
import fs from "fs";
import {withCreateAssociatedTokenAccount} from "../tools/withCreateAssociatedTokenAccount";
import {ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID} from "../../lib";

// const programId = new PublicKey('GTesTBiEWE32WHXXE2S4XbZvA5CrEc4xs6ZgRe895dP');
// const rpcEndpoint = clusterApiUrl('devnet');

const programId = new PublicKey('5xaMNNRZ5hKFTs45Y39ALQXVoXdrPAcRAY6cBqz1qc6R');
const rpcEndpoint = 'http://127.0.0.1:8899';

const connection = new Connection(rpcEndpoint, {
    commitment: "recent"
});

describe("capital based realm", () => {

    // let ownerKeypair: Keypair;
    // let delegateKeypair: Keypair;
    // let governanceProgramKeypair: Keypair
    // let usdcMintPublicKey = new PublicKey("3yFztHVjMawUZpEd1gckQHy4FH19ZbdS1h2SZmFKzcPj")
    // let limitedPartnerMintKeypair: Keypair
    // let delegateMintKeypair: Keypair;
    // let distributionMintKeypair: Keypair;
    // let governanceConfig: GovernanceConfig;
    // let realmName: string;
    // let capitalSupplyTreasuryPubkey: PublicKey;
    // let realmPublicKey: PublicKey;
    // let limitedPartnerMintPublicKey: PublicKey;
    // let governancePublicKey: PublicKey;

    // beforeAll(async () => {
    //
    //     ownerKeypair = Keypair.generate();
    //     await requestAirdrop(connection, ownerKeypair.publicKey)
    //     delegateKeypair = Keypair.generate();
    //     await requestAirdrop(connection, delegateKeypair.publicKey)
    //     governanceProgramKeypair = Keypair.generate();
    //     limitedPartnerMintKeypair = Keypair.generate();
    //     delegateMintKeypair = Keypair.generate();
    //     distributionMintKeypair = Keypair.generate();
    //     realmName = generateSlug(2);
    //
    //     // Crate governance over the the governance token mint
    //     governanceConfig = new GovernanceConfig({
    //         voteThresholdPercentage: new VoteThresholdPercentage({
    //             value: 60,
    //         }),
    //         minCommunityTokensToCreateProposal: new BN(1),
    //         minInstructionHoldUpTime: 0,
    //         maxVotingTime: getTimestampFromDays(3),
    //         voteTipping: VoteTipping.Strict,
    //         proposalCoolOffTime: 0,
    //         minCouncilTokensToCreateProposal: new BN(1),
    //     });
    //
    // });

    // test.skip("create capital based realm", async () => {
    //
    //     expect.assertions(1);
    //
    //     limitedPartnerMintPublicKey = limitedPartnerMintKeypair.publicKey
    //
    //     let mintInstructions: TransactionInstruction[] = [];
    //
    //     await createMintInstructions(
    //         mintInstructions,
    //         connection,
    //         limitedPartnerMintKeypair,
    //         ownerKeypair,
    //         0
    //     )
    //
    //     await createMintInstructions(
    //         mintInstructions,
    //         connection,
    //         delegateMintKeypair,
    //         ownerKeypair,
    //         0
    //     )
    //
    //     await createMintInstructions(
    //         mintInstructions,
    //         connection,
    //         distributionMintKeypair,
    //         ownerKeypair,
    //         0
    //     )
    //
    //     await executeMintInstructions(
    //         connection,
    //         mintInstructions,
    //         [
    //             limitedPartnerMintKeypair,
    //             delegateMintKeypair,
    //             distributionMintKeypair
    //         ],
    //         ownerKeypair
    //     )
    //
    //     await mintDelegateTokenForDelegate(
    //         connection,
    //         ownerKeypair,
    //         delegateMintKeypair.publicKey,
    //         delegateKeypair
    //     )
    //
    //     const ownerAta = await mintMaxLpTokens(
    //         connection,
    //         ownerKeypair,
    //         limitedPartnerMintKeypair.publicKey,
    //         ownerKeypair.publicKey,
    //         1000
    //     )
    //
    //     await setAuthority(
    //         connection,
    //         ownerKeypair,
    //         limitedPartnerMintKeypair.publicKey,
    //         ownerKeypair,
    //         AuthorityType.MintTokens,
    //         null
    //     )
    //
    //     realmPublicKey = await createRealm(
    //         connection,
    //         programId,
    //         ownerKeypair,
    //         delegateMintKeypair.publicKey,
    //         limitedPartnerMintKeypair.publicKey,
    //         generateSlug(2)
    //     )
    //
    //     await depositDelegateCouncilTokenInGovernance(
    //         connection,
    //         programId,
    //         delegateKeypair,
    //         ownerKeypair,
    //         realmPublicKey,
    //         delegateMintKeypair.publicKey
    //     )
    //
    //     const {
    //         limitedPartnerGovernancePublicKey,
    //         delegateMintGovernancePublicKey,
    //         distributionMintGovernancePublicKey
    //     } = await createGovernances(
    //         connection,
    //         programId,
    //         governanceConfig,
    //         ownerKeypair,
    //         realmPublicKey,
    //         delegateMintKeypair.publicKey,
    //         limitedPartnerMintKeypair.publicKey,
    //         distributionMintKeypair.publicKey
    //     )
    //
    //     governancePublicKey = limitedPartnerGovernancePublicKey;
    //
    //     await setLimitedPartnerGovernanceAsRealmAuthority(
    //         connection,
    //         programId,
    //         ownerKeypair,
    //         realmPublicKey,
    //         limitedPartnerGovernancePublicKey
    //     )
    //
    //     capitalSupplyTreasuryPubkey = await createTreasuryAccount(
    //         connection,
    //         ownerKeypair,
    //         usdcMintPublicKey,
    //         limitedPartnerGovernancePublicKey
    //     )
    //
    //     const treasuryStockTreasuryPubkey = await createTreasuryAccount(
    //         connection,
    //         ownerKeypair,
    //         limitedPartnerMintKeypair.publicKey,
    //         delegateMintGovernancePublicKey
    //     )
    //
    //     const distributionTreasuryPubkey = await createTreasuryAccount(
    //         connection,
    //         ownerKeypair,
    //         usdcMintPublicKey,
    //         distributionMintGovernancePublicKey
    //     )
    //
    //     await transfer(
    //         connection,
    //         ownerKeypair,
    //         ownerAta,
    //         treasuryStockTreasuryPubkey,
    //         ownerKeypair,
    //         1000
    //     )
    //
    //     console.log(limitedPartnerGovernancePublicKey.toBase58());
    //     console.log(realmPublicKey.toBase58());
    //
    //     expect(realmPublicKey).toBeDefined()
    //
    // });

    test.only("test deposit capital", async () => {

        /*
        Realm: J3nrXhaYtrmC4TtrE7yiKYfBwjLzTZWg6FLSx6caLojo

        LP Token Mint: 2AMvthMvHJ7moXxmGSsY5hwQzc8Skg3ZUzfbsbrRT5ei
        Delegate Token Mint: HLa7zUu57mNXBkWk7fQURzz9JYYXydbzw3cDfEQbibn4
        Distribution Token Mint: BQBb3aY5zHCqtuXKqKPYFaAT8qiaukaGAPbN6T9bHNqx

        LP Governance: CmMLAUCQF8m4TSa3LtBhKfCYau5wmUjWT8NTTouYjNE8
        LP Governed Account: 3Qt1MVCCV3LvMkmqSamq1xVQJPTyewypTeeEgnbjuy22
        Delegate Mint Governance: 8SPaUSRj6CaJaSZ1EFeiiRJSbckTv8HPZ2S8Yxf4Ca6J
        Distribution Mint Governance: 5JTfsAVH1frVYaSdQ517ZyQdNBwLQRfKjGqEYUxf9q8k

        Capital Supply Treasury: A2apqtALAk5sE4te4czB7eaQaBdga5XhmANNkYW1mqYN
        Treasury Stock Treasury: 9Y6wz8oSj731rWPCaT9Mku5CovT1RgxiSfumFfqupunV
        Distribution Treasury: CRhTvnWEf9j2c2k2YhDUfeKZ3VGNJUWtQFC7ubDwx5Xp

        */

        let instructions: TransactionInstruction[] = [];

        const ownerKeypair = await loadKeypair("~/.config/solana/id.json")
        const realmPublicKey = new PublicKey("J3nrXhaYtrmC4TtrE7yiKYfBwjLzTZWg6FLSx6caLojo")
        const usdcMintPublicKey = new PublicKey("EMVFgbUqg37ydgCX4r9nwRRCNnTGCqtTpxNnLtzYqs8D")
        const capitalGovernancePublicKey = new PublicKey("CmMLAUCQF8m4TSa3LtBhKfCYau5wmUjWT8NTTouYjNE8"); // lp governance
        const lpMintPublicKey = new PublicKey("2AMvthMvHJ7moXxmGSsY5hwQzc8Skg3ZUzfbsbrRT5ei");
        const lpGovernancePublicKey = new PublicKey("8SPaUSRj6CaJaSZ1EFeiiRJSbckTv8HPZ2S8Yxf4Ca6J");
        const lpGovernedAccountPublicKey = new PublicKey("HLa7zUu57mNXBkWk7fQURzz9JYYXydbzw3cDfEQbibn4")

        // @TODO: Create and pass user's ata into the withDepositCapital instruction

        // const userLpTokenAccount = await getOrCreateAssociatedTokenAccount(
        //     connection,
        //     ownerKeypair,
        //     usdcMintPublicKey,
        //     ownerKeypair.publicKey
        // )

        const usdcTokenSource = await getOrCreateAssociatedTokenAccount(
            connection,
            ownerKeypair,
            usdcMintPublicKey,
            ownerKeypair.publicKey
        )

        const [lpTokenAccount] = await PublicKey.findProgramAddress(
            [
                ownerKeypair.publicKey.toBuffer(),
                TOKEN_PROGRAM_ID.toBuffer(),
                lpMintPublicKey.toBuffer()
            ],
            ASSOCIATED_TOKEN_PROGRAM_ID
        )

        await withDepositCapital(
            instructions,
            programId,
            realmPublicKey,
            capitalGovernancePublicKey,
            lpGovernancePublicKey,
            lpGovernedAccountPublicKey,
            ownerKeypair.publicKey,
            usdcTokenSource.address,
            usdcMintPublicKey,
            lpTokenAccount,
            lpMintPublicKey,
            2
        )

        const tx = new Transaction()
        tx.add(...instructions);

        const sig = await sendAndConfirmTransaction(
            connection,
            tx,
            [ownerKeypair],
            {
                skipPreflight: true
            }
        )

        console.log(sig);

    });

});

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