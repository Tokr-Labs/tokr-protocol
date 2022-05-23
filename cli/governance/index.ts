#!/usr/bin/env node

import {Command} from "commander";

const {createDao} = require("./commands/create-dao");

export default (async (program: Command) => {

    const exampleConfig = `
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

    const command = program.command("governance")
        .description("create and interact with on-chain DAO governance.")
        .alias("gov")
        .addHelpText("afterAll", `\nExample Config File:\n${exampleConfig}`);

    command.command("create-dao")
        .alias("create")
        .description("Creates an Investment DAO based on the values passed in.")
        .requiredOption(
            "-i, --input-file <string>",
            "Input file containing the configuration of the DAO."
        )
        .action(async (options: any) => {

            await createDao(options.inputFile)

        });

})
