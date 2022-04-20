import * as anchor from "@project-serum/anchor";
import {AnchorProvider, Program} from "@project-serum/anchor";
import {Whitelist} from "../../target/types/whitelist";
import {assert} from "chai";
import {Keypair, Transaction, TransactionInstruction} from "@solana/web3.js";
import * as fs from "fs";

describe("test that the whitelist program", () => {

    let program: Program<Whitelist>;
    let provider: AnchorProvider;
    let keypair: Keypair;
    let authority: Keypair;

    before(async () => {

        anchor.setProvider(anchor.AnchorProvider.local());
        provider = anchor.AnchorProvider.local();
        program = anchor.workspace.Whitelist as Program<Whitelist>;

        let contents = fs.readFileSync(process.env.ANCHOR_WALLET);
        let parsed = String(contents)
            .replace("[", "")
            .replace("]", "")
            .split(",")
            .map((item) => Number(item))

        const uint8Array = Uint8Array.from(parsed);
        keypair = anchor.web3.Keypair.fromSecretKey(uint8Array);

        authority = anchor.web3.Keypair.generate();
        await provider.connection.requestAirdrop(authority.publicKey, 1000000000)

    })

    beforeEach(() => {
        console.log("authority = ", authority.publicKey.toBase58());
    })

    it("succeeds in creating a whitelist record for a user", async () => {

        const [account, bump] = await anchor.web3.PublicKey.findProgramAddress([
            Buffer.from('whitelist'),
            provider.wallet.publicKey.toBytes()
        ], program.programId);

        console.log("pda = ", account.toBase58(), bump);

        const tx = await program.rpc.createRecord(bump, authority.publicKey, {
            accounts: {
                signer: keypair.publicKey,
                record: account,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [keypair],
        });

        const accountInfo = await provider.connection.getAccountInfo(account);
        const accountMeta = await program.account.metadata.fetch(account);

        assert.equal(accountInfo.owner.toBase58(), program.programId.toBase58());
        assert.equal(accountMeta.status, 0);
        assert.equal(accountMeta.bump, bump);
        assert.equal(accountMeta.authority.toBase58(), authority.publicKey.toBase58());
        assert.exists(tx);

    });

    it("is able to update an account's status", async () => {

        const [account, bump] = await anchor.web3.PublicKey.findProgramAddress([
            Buffer.from('whitelist'),
            provider.wallet.publicKey.toBytes()
        ], program.programId);

        console.log("pda = ", account.toBase58(), bump);

        const tx = await program.rpc.updateRecord(1, {
            accounts: {
                record: account,
                subject: keypair.publicKey,
                signer: authority.publicKey
            },
            signers:[authority],
        });

        const accountMeta = await program.account.metadata.fetch(account);

        assert.equal(accountMeta.status, 1);

    });

    it("fails to update an account if the signer is not the authority", async () => {

        const [account, bump] = await anchor.web3.PublicKey.findProgramAddress([
            Buffer.from('whitelist'),
            provider.wallet.publicKey.toBytes()
        ], program.programId);

        console.log("pda = ", account.toBase58(), bump);

        const unknownKeypair = anchor.web3.Keypair.generate();

        try {

            const tx = await program.rpc.updateRecord(2, {
                accounts: {
                    record: account,
                    subject: keypair.publicKey,
                    signer: unknownKeypair.publicKey
                },
                signers: [unknownKeypair],
            });

        } catch (exception) {

            const error = exception.error;

            assert.equal(error.errorCode.code, "NotAuthorized");

        }

        const accountMeta = await program.account.metadata.fetch(account);

        assert.equal(accountMeta.status, 1);


    });

    it("will throw an error if a status is unknown", async () => {

        const [account, bump] = await anchor.web3.PublicKey.findProgramAddress([
            Buffer.from('whitelist'),
            provider.wallet.publicKey.toBytes()
        ], program.programId);

        console.log("pda = ", account.toBase58());

        const accountMeta = await program.account.metadata.fetch(account);
        const originalStatus = accountMeta.status;

        try {

            await program.rpc.updateRecord(3, {
                accounts: {
                    signer: [authority.publicKey],
                    record: account,
                    subject: keypair.publicKey,
                },
                signers: [authority]
            });

        } catch (exception) {

            console.log(exception);


            // console.log(exception);
            //
            // const error = exception.error;
            //
            // assert.equal(error.errorCode.code, "UnknownStatus");

        }

        assert.equal(accountMeta.status, originalStatus);

    });

});