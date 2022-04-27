#!/usr/bin/env node

const {Command} = require("commander");
const program = new Command();
const anchor = require("@project-serum/anchor");
const fs = require("fs");
const {Program} = require("@project-serum/anchor");
const loadKeypair = require("./utils/load-keypair").loadKeypair;

const PROGRAM_ID = new anchor.web3.PublicKey("JDS6WitBF654whkcWz5i5HX1ixska8Je4ahw7XYS7h5A");
const GROUP_PUBKEY = new anchor.web3.PublicKey("87ZjYTenZmy9pjXnYH79mkX1tEKnkcY97asnGqQ5Mtdc");

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
            "Keypair file location of account that will have authority over the whitelist account.",
        )
        .action(async (options) => {

            let userKeypair = await loadKeypair(options.user);
            let authority = await loadKeypair(options.authority);

            try {

                let config = fs.readFileSync(process.env.CONFIG);
                config = String(config);

                let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")[1]
                process.env.ANCHOR_PROVIDER_URL = rpcUrl.replace(/(")+/gi, "")

                anchor.setProvider(anchor.AnchorProvider.env());

                const [account, bump] = await anchor.web3.PublicKey.findProgramAddress([
                    GROUP_PUBKEY.toBytes(),
                    userKeypair.publicKey.toBytes()
                ], PROGRAM_ID);

                const whitelist = anchor.workspace.Whitelist;

                const tx = await whitelist.rpc.createRecord(bump, GROUP_PUBKEY, {
                    accounts: {
                        signer: userKeypair.publicKey,
                        record: account,
                        systemProgram: anchor.web3.SystemProgram.programId,
                        authority: authority.publicKey
                    },
                    signers: [userKeypair],
                });

                console.log(tx);

            } catch (error) {

                console.error(error);

            }

        });

    program.command("get-record")
        .description("Gets the information assoaciated with a record.")
        .requiredOption(
            "-u, --user <string>",
            "Keypair file location of user who the record is about.",
        )
        .action(async (options) => {

            let userKeypair = await loadKeypair(options.user);

            try {

                let config = fs.readFileSync(process.env.CONFIG);
                config = String(config);

                let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")[1]
                process.env.ANCHOR_PROVIDER_URL = rpcUrl.replace(/(")+/gi, "")

                anchor.setProvider(anchor.AnchorProvider.env());

                const [account, bump] = await anchor.web3.PublicKey.findProgramAddress([
                    GROUP_PUBKEY.toBytes(),
                    userKeypair.publicKey.toBytes()
                ], PROGRAM_ID);

                const whitelist = anchor.workspace.Whitelist;

                const meta = await whitelist.account.metadata.fetch(account);

                console.log("Meta: ");
                console.log(meta);

                process.exit(1);

            } catch (error) {

                console.error(error);

            }

        });

    await program.parseAsync();

})();
