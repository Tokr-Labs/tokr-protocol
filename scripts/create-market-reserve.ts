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
        console.log("npm run create-market-reserve -- --input scripts/example-inputs/usdc-reserve-input.json --output ~/Desktop/usdc-reserve.json --dry-run --skip-deploy --verbose");
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
    const marketAddress = inputJson.marketAddress;
    const pythPricePubkey = inputJson.pythPricePubkey;
    const pythProductPubkey = inputJson.pythProductPubkey;
    const liquidityTokenPubkey = inputJson.liquidityTokenPubkey;
    const optimalUtilizationRate = inputJson.config.optimalUtilizationRate;
    const loanToValueRatio = inputJson.config.loanToValueRatio
    const liquidationThreshold = inputJson.config.liquidationThreshold;
    const liquidationBonus = inputJson.config.liquidationBonus;
    const minBorrowRate = inputJson.config.minBorrowRate;
    const maxBorrowRate = inputJson.config.maxBorrowRate;
    const optimalBorrowRate = inputJson.config.optimalBorrowRate;
    const borrowFeeWad = inputJson.config.fees.borrowFeeWad;
    const flashLoanFeeWad = inputJson.config.fees.flashLoanFeeWad;
    const hostFeePercentage = inputJson.config.fees.hostFeePercentage;


    if (verbose) {
        console.log(`Owner Key Pair: ${ownerKeyPair}`);
        console.log(`Lending Key Pair: ${lendingKeyPair}`);
        console.log(`Token Lending CLI: ${tokenLendingCli}`);
        console.log(`Token Lending EXE: ${tokenLendingExe}`);
        console.log(`Pyth Price Pubkey: ${pythPricePubkey}`);
        console.log(`Pyth Product Pubkey: ${pythProductPubkey}`);
        console.log(`Liquidity Token Pubkey: ${liquidityTokenPubkey}`)
        console.log(`Optimal Utilization Rate: ${optimalUtilizationRate}`);
        console.log(`Loan To Value Ratio: ${loanToValueRatio}`);
        console.log(`Liquidation Threshold: ${liquidationThreshold}`);
        console.log(`Liquidation Bonus: ${liquidationBonus}`);
        console.log(`Min Borrow Rate: ${minBorrowRate}`);
        console.log(`Max Borrow Rate: ${maxBorrowRate}`);
        console.log(`Optimal Borrow Rate: ${optimalBorrowRate}`);
        console.log(`Borrow Fee Wad: ${borrowFeeWad}`);
        console.log(`Flash Loan Fee Wad: ${flashLoanFeeWad}`);
        console.log(`Host Fee Percentage: ${hostFeePercentage}`);
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

    // console.log(`Creating market...`);
    //
    // let createMarketOutput = { data: "" };
    //
    // try {
    //
    //     /*
    //         expected output:
    //             Creating lending market B3JSdKxZwXYddZXDtkWXXoHJ2xaBxiEzz7HC6XQ9noAZ
    //             Signature: 5f3Wi6oPGs2W2qt1jQzTUtfpUphX7zeuLJbGobUFAkhh6qHNndRMpNLmJkQEKBe4iX2DB6NPJa4hGJVnPYz5QDEg
    //     */
    //     createMarketOutput = await exec(`
    //         ${tokenLendingCli}
    //             --program ${lendingAddress.data}
    //             create-market
    //             --fee-payer ${ownerKeyPair}
    //             --market-owner ${ownerAddress.data}
    //             ${verbose ? "--verbose" : ""}
    //             ${dryRun ? "--dry-run" : ""}
    //     `, {capture: true, echo: verbose});
    //
    // } catch (error) {
    //
    //     console.log(error);
    //     process.exit(0);
    //
    // }
    //
    // const marketAddress = createMarketOutput.data.match(".*(?:Creating lending market)(.*)")![1].trim();
    //
    // console.log(`Market Address: ${marketAddress}`);
    // console.log(`Adding reserve...`);

    let addReserveOutput = {data: ""};

    try {

        /*
        expected output:
            Adding reserve 52avDtVm26K4Af1WNmfCcZFmrsYpXZ18XKxUqem7bDWY
            Adding collateral mint FmWmCy3npv829Qo8iQY9QM4TXknTXd3vYJiABjcGy7k6
            Adding collateral supply 6F91jM7i3bAXs9GzehU5iu1uCHQ1jNWAqhDwQ37WHJVs
            Adding liquidity supply EH2mAuC7eXA5Ap9FdvyDN8D983NtYN5reQbjyRyJgLd4
            Adding liquidity fee receiver ERUAn991SD3gSSYYpkTea8yKGRmQV9HdQabSVShf4bvg
            Adding user collateral JJrLA16nToF3aAGekQc4RjSYKs3Fr3VPnXBHmodi7x3
            Adding user transfer authority J3M9DTCBVXdGnEX37FKtuJdLZp4qZxMrz4GE3UnMpzMW

            Signature: 5pDivwX6jt89twVfRzb3rFD9j1SoqmaQMRJwyaBXNu3Zhpgc2fbtjrAitm9XEx31GD4crdjTbFP7wFBFQHo2VTWa
            Signature: MC2rK2Up3WjNDYafFfUSUFgFZLphijT1H8uS3aW5gPxHp7UGFzPXB6KYQFisuWERdFfb9ScFcXSAs7uKEEJ7kRe
            Signature: 4K2t1KobvS7iwC6k68GTfszTtqeaof86ERdH2Zs9r59JJM5TBi2BX3pQxgoiehfZF6BBoUxqh854PZPC5yUzJEr2
        */
        addReserveOutput = await exec(`
            ${tokenLendingCli}
                --program ${lendingAddress.data}
                add-reserve
                --market ${marketAddress}
                --market-owner ${ownerKeyPair}
                --amount 1
                --pyth-price ${pythPricePubkey}
                --pyth-product ${pythProductPubkey}
                --source ${liquidityTokenPubkey}
                --source-owner ${ownerKeyPair}
                --fee-payer ${ownerKeyPair}
                ${verbose ? "--verbose" : ""}
                ${dryRun ? "--dry-run" : ""}
        `, {capture: true})

    }  catch (error) {

        console.log(error);
        process.exit(0);

    }

    if (verbose) {

        console.log(addReserveOutput.data);

    }

    if (addReserveOutput.data === undefined || addReserveOutput.data === "") {
        console.error("Could not retrieve reserve output.")
        process.exit(0);
    }

    const reserveAddress = addReserveOutput.data.match(".*(?:Adding reserve)(.*)")![1].trim();
    const collateralMintAddress = addReserveOutput.data.match(".*(?:Adding collateral mint)(.*)")![1].trim();
    const collateralSupplyAddress = addReserveOutput.data.match(".*(?:Adding collateral supply)(.*)")![1].trim();
    const liquiditySupplyAddress = addReserveOutput.data.match(".*(?:Adding liquidity supply)(.*)")![1].trim();
    const liquidityFeeReceiverAddress = addReserveOutput.data.match(".*(?:Adding liquidity fee receiver)(.*)")![1].trim();
    const userCollateralAddress = addReserveOutput.data.match(".*(?:Adding user collateral)(.*)")![1].trim();
    const transferAuthorityAddress = addReserveOutput.data.match(".*(?:Adding user transfer authority)(.*)")![1].trim();

    if (verbose) {

        console.log(`Reserve Address: ${reserveAddress}`);
        console.log(`Collateral Mint Address: ${collateralMintAddress}`);
        console.log(`Collateral Supply Address: ${collateralSupplyAddress}`);
        console.log(`Liquidity Supply Address: ${liquiditySupplyAddress}`);
        console.log(`Liquidity Fee Receiver Address: ${liquidityFeeReceiverAddress}`);
        console.log(`User Collateral Address: ${userCollateralAddress}`);
        console.log(`Transfer Authority Address: ${transferAuthorityAddress}`);
        console.log(`Reserve Address: ${reserveAddress}`);

    }

    const content = `{
        "marketPubkey": "${marketAddress}",
        "reserves": [{
            "reservePubkey": "${reserveAddress}",
            "liquidity": {
                "liquidityMintPubkey": "${marketAddress}",
                "liquiditySupplyPubkey": "${liquiditySupplyAddress}",
                "feeReceiverPubkey": "${ownerAddress.data}",
                "oraclePricePubkey": "${pythPricePubkey}",
                "oracleProductPubkey": "${pythProductPubkey}"
            },
            "collateral": {
                "collateralMintPubkey": "${collateralMintAddress}",
                "collateralSupplyPubkey": "${collateralSupplyAddress}"
            },
            "config": {
                "optimalUtilizationRate": ${optimalUtilizationRate},
                "loanToValueRatio": ${loanToValueRatio},
                "liquidationBonus": ${liquidationBonus},
                "liquidationThreshold": ${liquidationThreshold},
                "minBorrowRate": ${minBorrowRate},
                "maxBorrowRate": ${maxBorrowRate},
                "optimalBorrowRate": ${optimalBorrowRate},
                "fees": {
                    "borrowFeeWad": ${borrowFeeWad},
                    "flashLoanFeeWad": ${flashLoanFeeWad},
                    "hostFeePercentage": ${hostFeePercentage}
                }
            }
        }]
    }`;

    console.log(`Writing output file...`);

    if (dryRun) {
        console.log(content);
    } else {
        writeFileSync(outputFile, content);
    }

    console.log(`Done.`);

})();