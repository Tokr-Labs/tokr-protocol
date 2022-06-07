import BN from "bn.js";
import {
    Commitment,
    Connection,
    Keypair,
    PublicKey,
    sendAndConfirmTransaction,
    Transaction,
    TransactionInstruction,
    TransactionSignature
} from "@solana/web3.js"
import {GovernanceConfig, VoteThresholdPercentage} from "../../../programs/governance/client/src/governance/accounts"
import {withCreateInvestmentDao} from "../../../programs/governance/client/src/governance/withCreateInvestmentDao"
import fs, {readFileSync} from "fs";
import * as process from "process";
import {validateRealmConfig} from "../../utils/validate-realm-config";
import {resolveHome} from "../../utils/resolve-home";
import {generateSlug} from "random-word-slugs";
import {loadKeypair} from "../../utils/load-keypair";
import {updateLocalConfig} from "../../utils/update-local-config";

export const createDao = async (
    configFile: string,
    skipPreflight = true,
    commitment: Commitment = "singleGossip"
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
    const name = config.name !== "" ? config.name : generateSlug(3, {format: "title"});

    const governanceProgramId = config.governanceProgramId;
    const usdcMint = config.usdcMint;
    const maxLpTokenSupply = config.details.maxRaise;
    const governanceConfig = config.governance;

    console.log();
    console.log("Input:")
    console.log();
    console.log(config)
    console.log();

    await updateLocalConfig(owner, cluster);

    const connection = new Connection(cluster, {commitment})

    const ownerKeypair = await loadKeypair(owner);
    // @TODO: For now we're always making the creator of the delegate of the dao, otherwise we cannot deposit the
    //    token into the dao for the delegate.
    const delegateKeypair = ownerKeypair; // await loadKeypair(delegate);
    const governanceProgramIdPublicKey = new PublicKey(governanceProgramId);
    const usdcMintPublicKey = new PublicKey(usdcMint);
    const limitedPartnerMintKeypair = Keypair.generate();
    const delegateMintKeypair = Keypair.generate();
    const distributionMintKeypair = Keypair.generate();

    const instructionSets: TransactionInstruction[][] = [];

    const realmConfig = new GovernanceConfig({
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

    const ixResponse = await withCreateInvestmentDao(
        connection,
        ownerKeypair.publicKey,
        delegateKeypair.publicKey,
        instructionSets,
        delegateMintKeypair.publicKey,
        usdcMintPublicKey,
        distributionMintKeypair.publicKey,
        limitedPartnerMintKeypair.publicKey,
        governanceProgramIdPublicKey,
        realmConfig,
        name,
        maxLpTokenSupply
    )

    const signerSets = [
        [limitedPartnerMintKeypair, delegateMintKeypair, distributionMintKeypair, ownerKeypair], // mint creation instructions set
        [ownerKeypair], // delegate token instructions set
        [ownerKeypair], // realm creation instructions set
        [ownerKeypair], // treasury account creation instructions set
    ]

    const result = await sendTransactions(
        connection,
        instructionSets,
        signerSets,
        commitment,
        skipPreflight,
        ownerKeypair
    )

    console.log("Transactions:")
    console.log(result);
    console.log();

    console.log("Output:")
    console.log(`
    {
        "name": "${name}",
        "description": "${config.description}",
        "active": false,
        "strategy": ${config.strategy},
        "token": {
            "ticker": "${config.token.ticker}",
            "image": "${config.token.image}"
        },
        "stakeholders": {
            "sponsor": {
                "name": "${config.stakeholders.sponsor.name}",
                "company": "${config.stakeholders.sponsor.company}",
                "image": "${config.stakeholders.sponsor.image}"
            },
            "delegate": {
                "name": "${config.stakeholders.delegate.name}",
                "company": "${config.stakeholders.delegate.company}",
                "image": "${config.stakeholders.delegate.image}"
            }
        },
        "details": {
            "min_raise": ${config.details.minRaise},
            "max_raise": ${config.details.maxRaise},
            "min_investment": ${config.details.minInvestment},
            "raise_close": ${config.details.raiseClose},
            "vintage_year": "${config.details.vintageYear}",
            "fund_term": ${config.details.fundTerm},
            "data_room": "${config.details.dataRoom}",
            "target_returns": {
                "irr": ${config.details.targetReturns.irr},
                "coc": ${config.details.targetReturns.coc},
                "tvpi": ${config.details.targetReturns.tvpi},
                "dpi": ${config.details.targetReturns.dpi}
            },
            "fees": {
                "closing": ${config.details.fees.closing},
                "annual": ${config.details.fees.annual}
            }
        },
        "addresses": {
            "realm": "${ixResponse.realm.toBase58()}",
            "governance": {
                "lp_token_governance": "${ixResponse.limitedPartnerGovernance.toBase58()}",
                "distribution_token_mint_governance": "${ixResponse.distributionMintGovernance.toBase58()}",
                "delegate_token_mint_governance": "${ixResponse.delegateMintGovernance.toBase58()}"
            },
            "mint": {
                "lp_token_mint": "${limitedPartnerMintKeypair.publicKey.toBase58()}",
                "distribution_token_mint": "${distributionMintKeypair.publicKey.toBase58()}",
                "delegate_token_mint": "${delegateMintKeypair.publicKey.toBase58()}"
            },
            "treasury": {
                "capital_supply": "${ixResponse.capitalSupplyTreasury.toBase58()}",
                "distributions": "${ixResponse.distributionTreasury.toBase58()}",
                "stock_supply": "${ixResponse.treasuryStockTreasury.toBase58()}"
            }
        } 
     } 
    `)

    console.log()
    console.log("Complete.")
    process.exit(0);

}

// helpers

export const sendTransactions = async (
    connection: Connection,
    instructionSet: TransactionInstruction[][],
    signersSet: Keypair[][],
    commitment: Commitment,
    skipPreflight: boolean,
    feePayer: Keypair,
): Promise<TransactionSignature[]> => {

    const block = await connection.getLatestBlockhash(commitment)

    let transactions: Promise<any>[] = []

    for (let i = 0; i < instructionSet.length; i++) {

        const instructions = instructionSet[i]
        const signers = signersSet[i]

        if (instructions.length === 0) {
            continue
        }

        const transaction = new Transaction({recentBlockhash: block.blockhash})
        transaction.feePayer = feePayer.publicKey
        transaction.add(...instructions);

        transactions.push(
            sendAndConfirmTransaction(
                connection,
                transaction,
                signers,
                {
                    skipPreflight,
                    commitment
                }
            ).then(sig => console.log(sig))
        )

    }

    return await Promise.all(transactions)

}
