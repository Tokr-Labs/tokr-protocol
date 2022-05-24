#!/usr/bin/env node

import {Command} from "commander";
import {depositCapital} from "./commands/deposit-capital";

const {createDao} = require("./commands/create-dao");

export default (async (program: Command) => {

    const daoConfig = `
    {
        "cluster": "http://localhost:8899",
        "owner": "~/.config/solana/id.json",
        "delegate": "~/solana-keys/peacemaker.json",
        "name": "L27",
        "governanceProgramId": "5Hyx5g6n82uZpVYRLZqssLSj5V6mZc2QYQFtPcj83Jp2",
        "usdcMint": "Ha46W7m15Pviwwv95AnjXThFxum3nhcjEdvSw9GxxTWA",
        "maxLpTokenSupply": 100000,
        "governance": {
            "voteThresholdPercentage": 25,
            "minCommunityTokensToCreateProposal": 10000000,
            "minInstructionHoldUpTime": 0,
            "maxVotingTime": 259250,
            "voteTipping": 0,
            "proposalCoolOffTime": 0,
            "minCouncilTokensToCreateProposal": 1
        }
    }
    `

    const depositCapitalConfig = `
    {
        "cluster": "http://localhost:8899",
        "owner": "~/.config/solana/id.json",
        "delegate": "~/solana-keys/peacemaker.json",
        "governanceProgramId": "5Hyx5g6n82uZpVYRLZqssLSj5V6mZc2QYQFtPcj83Jp2",
        "identityVerificationProgramId": "3YC2irJKAzmuqeg2Qf9v8YBb1ufGmYTuvggxqv4bCyST",
        "usdcMint": "Ha46W7m15Pviwwv95AnjXThFxum3nhcjEdvSw9GxxTWA",
        "realm": "98VUKFoD7KqYfBNnvyJiuKmb8sj5ws7HotZopSngxsqY",
        "lpGovernance": "HApH8Zr8fqXyoH3xyjaj4PBdgWyCDPiGevu4ijTCGb9E",
        "lpMint": "HzhBrBLD8NQrE1jwHNptvmFmgQ1nddtHTamWy7eqLtTJ",
        "delegateMintGovernance": "UW21kChKwbPjtrYipcGqWXrKkG3XvHchKYgbLdauhCB",
        "delegateTokenMint": "F2RdujrSfffnTc1Qps8bEtxW25Wm2j1u7d2Ph3ZLQKzt",
        "realm": "98VUKFoD7KqYfBNnvyJiuKmb8sj5ws7HotZopSngxsqY"
    }
    `

    const command = program.command("governance")
        .description("create and interact with on-chain DAO governance.")
        .alias("gov")

    command.command("create-dao")
        .alias("create")
        .description("Creates an Investment DAO based on the values passed in.")
        .requiredOption(
            "-i, --input-file <string>",
            "Input file containing the configuration of the DAO."
        )
        .action(async (options: any) => {

            await createDao(options.inputFile)

        })
        .addHelpText("afterAll", `\nExample Config File:\n${daoConfig}`);

    command.command("deposit-capital")
        .description("Deposit capital into an investment DAO.")
        .requiredOption(
            "-i, --input-file <string>",
            "Input file containing the configuration of the capital deposit."
        )
        .action(async (options: any) => {

            await depositCapital(options.inputFile)

        })
        .addHelpText("afterAll", `\nExample Config File:\n${depositCapitalConfig}`);

})
