#!/usr/bin/env node

import {exec} from "./utils/exec";
import {readFileSync, writeFileSync} from "fs";
import yargs from "yargs";
import {hideBin} from "yargs/helpers";

(async () => {

    const argv = await yargs(hideBin(process.argv)).argv;

    const inputFile = argv.input as string;
    const outputFile = argv.output as string;

    if (inputFile === undefined || outputFile === undefined) {
        console.log("Example Usage:");
        console.log("npm run create-lending-market -- --input ./scripts/example-inputs/market-input.json --output ~/Desktop/market-1.json --dry-run --skip-deploy --verbose");
        process.exit(0);
    }

    const dryRun = argv.dryRun ?? false;
    const skipDeploy = (argv.skipDeploy ?? false) as boolean;
    const verbose = (argv.verbose ?? false) as boolean;

    const input = readFileSync(inputFile, {encoding: "utf8"})
    const inputJson = JSON.parse(input);

    const ownerKeyPair = inputJson.ownerKeyPair;
    const lendingKeyPair = inputJson.lendingKeyPair;
    const tokenLendingCli = inputJson.tokenLendingCli;
    const tokenLendingExe = inputJson.tokenLendingExe;

    if (verbose) {
        console.log(`Owner Key Pair: ${ownerKeyPair}`);
        console.log(`Lending Key Pair: ${lendingKeyPair}`);
        console.log(`Token Lending CLI: ${tokenLendingCli}`);
        console.log(`Token Lending EXE: ${tokenLendingExe}`);
    }

    console.log("Setting up solana config...");

    await exec(`
        solana config set 
        --url https://api.devnet.solana.com 
        -k ${ownerKeyPair}
    `, {echo: verbose});

    console.log("Deriving owner and lending addresses...");

    let ownerAddress = await exec(`solana address`, {capture: true, echo: verbose})
    let lendingAddress = await exec(`solana address -k ${lendingKeyPair}`, {capture: true, echo: verbose})

    console.log(`Owner Address: ${ownerAddress.data}`);
    console.log(`Lending Address: ${lendingAddress.data}`);

    if (!skipDeploy) {

        console.log(`Deploying program...`);

        try {

            /*
                expected output:
                    RPC URL: https://api.devnet.solana.com
                    Default Signer Path: /Users/ericmcgary/Documents/workspace/tokr/keys/owner-041222325.json
                    Commitment: confirmed
                    Program Id: EViMcQj2B7GSc1k8DnFof3xV9r4k7twrHM5LadHGrmXe
            */
            await exec(`
                solana program
                    --config ${process.env.CONFIG}
                    deploy
                    --program-id ${lendingKeyPair}
                    ${tokenLendingExe}
                    --verbose
            `, {echo: verbose})

        } catch (error) {

            console.log(error);
            process.exit(0);

        }

    } else {

        console.log("Skipping deploy.")

    }

    console.log(`Creating market...`);

    let createMarketOutput = { data: "" };

    try {

        /*
            expected output:
                Creating lending market B3JSdKxZwXYddZXDtkWXXoHJ2xaBxiEzz7HC6XQ9noAZ
                Signature: 5f3Wi6oPGs2W2qt1jQzTUtfpUphX7zeuLJbGobUFAkhh6qHNndRMpNLmJkQEKBe4iX2DB6NPJa4hGJVnPYz5QDEg
        */
        createMarketOutput = await exec(`
            ${tokenLendingCli}
                --program ${lendingAddress.data}
                create-market
                --fee-payer ${ownerKeyPair}
                --market-owner ${ownerAddress.data}
                ${verbose ? "--verbose" : ""}
                ${dryRun ? "--dry-run" : ""}
        `, {capture: true, echo: verbose});

    } catch (error) {

        console.log(error);
        process.exit(0);

    }

    const marketAddress = createMarketOutput.data.match(".*(?:Creating lending market)(.*)")![1].trim();

    console.log(`Market Address: ${marketAddress}`);

    const content = `{
        "marketPubkey": "${marketAddress}"  
    }`;

    console.log(`Writing output file...`);

    if (dryRun) {
        console.log(content);
    } else {
        writeFileSync(outputFile, content);
    }

    console.log(`Done.`);

})();