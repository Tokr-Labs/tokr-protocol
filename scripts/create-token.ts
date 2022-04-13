#!/usr/bin/env node

import {exec} from "./utils/exec";
import * as path from "path";
import {readFileSync, writeFileSync, writeSync} from "fs";
import yargs, {exit} from "yargs";
import {hideBin} from "yargs/helpers";

(async () => {

    const argv = await yargs(hideBin(process.argv)).argv;

    const inputFile = argv.input as string;
    const outputDir = argv.outputDir as string;

    if (inputFile === undefined || outputDir === undefined) {
        console.log("Example Usage:");
        console.log("npm run create-token -- --input scripts/example-inputs/usdc-token-input.json --output-dir ~/Desktop --verbose");
        process.exit(0);
    }


    const input = readFileSync(inputFile, {encoding: "utf8"})
    const inputJson = JSON.parse(input);

    const ownerKeyPair = inputJson.ownerKeyPair;
    const currencySymbol = inputJson.currencySymbol;

    console.log("Inputs: ");

    console.log(`Owner Key Pair: ${ownerKeyPair}`);
    console.log(`Lending Key Pair: ${currencySymbol}`);

    console.log("Setting up solana config...");

    try {

        await exec(`
            solana config set 
            --url https://api.devnet.solana.com 
            -k ${ownerKeyPair}
        `);

    } catch (error) {

        console.error(error);
        process.exit(0);

    }

    console.log("Deriving owner address...");

    let ownerAddress = await exec(`solana address`, {capture: true})

    console.log(`Owner Address: ${ownerAddress.data}`);

    console.log("Creating reserve token mint...");

    /*
        expected output:
            Creating token XYJcUbyKp6FrLQ21DTC3VvCXzwjC8h3h9WbXFNzdepK
            Signature: 51dZTdLXwFQNoPLEa2FQouJEwANGZnpfnkZ1unBPmRPaRFonpGrYcM4TE1pLUh532MR2MEqcrytZNg5sfp7o9MRm
    */

    let mintAddress = "";

    try {

        const createTokenOutput = await exec(`
            spl-token create-token
                --verbose
        `, {capture: true});

        mintAddress = createTokenOutput.data.match(".*(?:Creating token)(.*)")![1].trim();

    } catch (error) {

        console.error(error);
        process.exit(0);

    }


    console.log(`Mint Address: ${mintAddress}`);
    console.log("Creating reserve token account...");

    let tokenAddress = "";

    try {

        /*
            expected output:
                Creating account 79JADzMiUE51nCh8XqgRAnb6qVBDyN23fhbga1otDtB4
                Signature: Bhmaihz5oomhcDnFe2xgfAWrUe138PXY1oobj7nFm1TnJRataA5uwTSYUm93K1isjkRSBStPRgHKQz8FhAMtTsp
        */
        const createTokenAccountOutput = await exec(`
            spl-token create-account 
                ${mintAddress}
        `, {capture: true});

        tokenAddress = createTokenAccountOutput.data.match(".*(?:Creating account)(.*)")![1].trim();

    } catch (error) {
        console.log(error);
        process.exit(0);
    }

    console.log(`Token Address: ${tokenAddress}`);
    console.log(`Minting token ${tokenAddress}...`);


    try {

        /*
        expected output:
            Minting 1000 tokens
            Token: XYJcUbyKp6FrLQ21DTC3VvCXzwjC8h3h9WbXFNzdepK
            Recipient: 79JADzMiUE51nCh8XqgRAnb6qVBDyN23fhbga1otDtB4
            Signature: 2Dx2YN3tUVnGHfGYehkvJ2vdwUFPGBqojn4cteecUDvxYBDqn5gCU7tbs3myh7uxzJ1q81gwzXRrnicbCfWZ3qpu
        */
        await exec(`spl-token mint ${mintAddress} 1000`)

    } catch (error) {
        console.log(error);
        process.exit(0);
    }

    console.log(`Writing output file...`);

    const content = `{
        "symbol": "${currencySymbol}",
        "tokenAddress": "${tokenAddress}",
        "tokenMintAddress": "${mintAddress}"
    }`;

    writeFileSync(path.join(outputDir,`${currencySymbol.toLowerCase()}-token.json`), content);

    console.log(`Done.`);

})();