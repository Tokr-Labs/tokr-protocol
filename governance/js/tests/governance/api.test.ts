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
    let capitalSupplyTreasuryPubkey: PublicKey;
    let realmPublicKey: PublicKey;
    let limitedPartnerMintPublicKey: PublicKey;
    let governancePublicKey: PublicKey;

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

    test.skip("create capital based realm", async () => {

        expect.assertions(1);

        limitedPartnerMintPublicKey = limitedPartnerMintKeypair.publicKey

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

        await mintDelegateTokenForDelegate(
            connection,
            ownerKeypair,
            delegateMintKeypair.publicKey,
            delegateKeypair
        )

        const ownerAta = await mintMaxLpTokens(
            connection,
            ownerKeypair,
            limitedPartnerMintKeypair.publicKey,
            ownerKeypair.publicKey,
            1000
        )

        await setAuthority(
            connection,
            ownerKeypair,
            limitedPartnerMintKeypair.publicKey,
            ownerKeypair,
            AuthorityType.MintTokens,
            null
        )

        realmPublicKey = await createRealm(
            connection,
            programId,
            ownerKeypair,
            delegateMintKeypair.publicKey,
            limitedPartnerMintKeypair.publicKey,
            generateSlug(2)
        )

        await depositDelegateCouncilTokenInGovernance(
            connection,
            programId,
            delegateKeypair,
            ownerKeypair,
            realmPublicKey,
            delegateMintKeypair.publicKey
        )

        const {
            limitedPartnerGovernancePublicKey,
            delegateMintGovernancePublicKey,
            distributionMintGovernancePublicKey
        } = await createGovernances(
            connection,
            programId,
            governanceConfig,
            ownerKeypair,
            realmPublicKey,
            delegateMintKeypair.publicKey,
            limitedPartnerMintKeypair.publicKey,
            distributionMintKeypair.publicKey
        )

        governancePublicKey = limitedPartnerGovernancePublicKey;

        await setLimitedPartnerGovernanceAsRealmAuthority(
            connection,
            programId,
            ownerKeypair,
            realmPublicKey,
            limitedPartnerGovernancePublicKey
        )

        capitalSupplyTreasuryPubkey = await createTreasuryAccount(
            connection,
            ownerKeypair,
            usdcMintPublicKey,
            limitedPartnerGovernancePublicKey
        )

        const treasuryStockTreasuryPubkey = await createTreasuryAccount(
            connection,
            ownerKeypair,
            limitedPartnerMintKeypair.publicKey,
            delegateMintGovernancePublicKey
        )

        const distributionTreasuryPubkey = await createTreasuryAccount(
            connection,
            ownerKeypair,
            usdcMintPublicKey,
            distributionMintGovernancePublicKey
        )

        await transfer(
            connection,
            ownerKeypair,
            ownerAta,
            treasuryStockTreasuryPubkey,
            ownerKeypair,
            1000
        )

        console.log(limitedPartnerGovernancePublicKey.toBase58());
        console.log(realmPublicKey.toBase58());

        expect(realmPublicKey).toBeDefined()

    });

    test.only("test deposit capital", async () => {

        /*
        Realm: BbAuiXPYT3mC2YPj8HgrrhhBHPESxRkNemwvkg7DMGoc

        LP Token Mint: ActeXiVCMToMc4LWRUTSGVoQqqxCPL2TdJ7yR83WnzLa
        Delegate Token Mint: Fi54qWhNLceHjYmEvhMBPDq2A95N4AXm9pVy9Ny49HYE
        Distribution Token Mint: FVUvfTkMHbJwkFqUkWx98BgiNrAs343pKMrK3HyEmYTh

        LP Governance: 3iPwCJHfNeWfZpce53gRet9oqpxzjEJF7CTmnX9U9EeK
        Delegate Mint Governance: 7MtNagvsuqo55ob65Q1f6savXshDvqij7jLNTZdX8NK8
        Distribution Mint Governance: 8NjAPYjuD5EsQUtTLvzNpdkQMZhpYjLLFQPUbeo6XccH

        Capital Supply Treasury: JDtYuu8JX2ssWaN3kxcZ2xbA2Xq3JURYEfKpnYcW8U8K
        Treasury Stock Treasury: 7LRy5eAsHY8NixuXV19cQW8tu1EiHxWQmpWeJUtib5c5
        Distribution Treasury: BmamJEQcAwLGYc4fGFZD61WdPYkGFG2Z8rusx9GEaPN7
        */

        let instructions: TransactionInstruction[] = [];

        // comment out the following 5 lines if running tests all together
        ownerKeypair = await loadKeypair("~/.config/solana/id.json")
        delegateKeypair = ownerKeypair
        realmPublicKey = new PublicKey("BbAuiXPYT3mC2YPj8HgrrhhBHPESxRkNemwvkg7DMGoc")
        usdcMintPublicKey = new PublicKey("3yFztHVjMawUZpEd1gckQHy4FH19ZbdS1h2SZmFKzcPj")
        governancePublicKey = new PublicKey("3iPwCJHfNeWfZpce53gRet9oqpxzjEJF7CTmnX9U9EeK");

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

        await withDepositCapital(
            instructions,
            programId,
            realmPublicKey,
            governancePublicKey,
            ownerKeypair.publicKey,
            usdcTokenSource.address,
            usdcMintPublicKey,
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