#!/usr/bin/env node

const {Command} = require("commander");
const program = new Command();
const anchor = require("@project-serum/anchor");
const whitelist = require("../../target/idl/whitelist.json");
const {Program} = require("@project-serum/anchor");
const fs = require("fs");
const exec = require("./utils/exec").exec;
const loadKeypair = require("./utils/load-keypair").loadKeypair;

const PROGRAM_ID = new anchor.web3.PublicKey("JDS6WitBF654whkcWz5i5HX1ixska8Je4ahw7XYS7h5A");

(async function main() {

    program
        .name("tokr-whitelist")
        .description("CLI to manage whitelists offline")
        .version("0.1.0");

    program.command("create-record")
        .description("Creates a whitelist record for a user and sets its authority.")
        .requiredOption(
            "-u, --user <string>",
            "Keypair file location of user who is going to have a record about.",
        )
        .requiredOption(
            "-a, --authority <string>",
            "Keypair file location of authority",
        )
        .action(async (options) => {

            let userKeypair = await loadKeypair(options.user);
            let authorityKeypair = await loadKeypair(options.authority);

            try {

                let config = fs.readFileSync(process.env.CONFIG);
                config = String(config);

                let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")[1]
                process.env.ANCHOR_PROVIDER_URL = rpcUrl.replace(/(")+/gi, "")

                anchor.setProvider(anchor.AnchorProvider.env());

                const [account, bump] = await anchor.web3.PublicKey.findProgramAddress([
                    Buffer.from('whitelist'),
                    userKeypair.publicKey.toBytes()
                ], PROGRAM_ID);

                const whitelist = anchor.workspace.Whitelist;

                const tx = await whitelist.rpc.createRecord(bump, {
                    accounts: {
                        signer: userKeypair.publicKey,
                        record: account,
                        systemProgram: anchor.web3.SystemProgram.programId
                    },
                    signers:[userKeypair]
                })

                console.log(tx);

            } catch (error) {

                console.error(error);

            }

        });

    await program.parseAsync();

})();
