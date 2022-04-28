import * as anchor from "@project-serum/anchor";
import {AnchorProvider, Program} from "@project-serum/anchor";
import {IdentityVerification} from "../../target/types/identity_verification";
import {assert} from "chai";
import {Keypair, PublicKey, Transaction} from "@solana/web3.js";
import * as fs from "fs";


describe("test that the identity-verification program", () => {

    let program: Program<IdentityVerification>;
    let provider: AnchorProvider;
    let keypair: Keypair;
    let authority: Keypair;
    let newAuthority: Keypair;
    let nonAuthority: Keypair;
    let groupKeypair: Keypair;
    let pdaPubkey: PublicKey;
    let pdaBump: number

    before(async () => {

        anchor.setProvider(anchor.AnchorProvider.local());
        provider = anchor.AnchorProvider.local();
        program = anchor.workspace.IdentityVerification as Program<IdentityVerification>;

        let contents = fs.readFileSync(process.env.ANCHOR_WALLET);
        let parsed = String(contents)
            .replace("[", "")
            .replace("]", "")
            .split(",")
            .map((item) => Number(item))

        const uint8Array = Uint8Array.from(parsed);
        keypair = anchor.web3.Keypair.fromSecretKey(uint8Array);
        console.log("keypair = ", keypair.publicKey.toBase58());

        // make this account real
        authority = anchor.web3.Keypair.generate();
        console.log("authority = ", authority.publicKey.toBase58());
        await provider.connection.requestAirdrop(authority.publicKey, 1000000000)

        // make this account real
        newAuthority = anchor.web3.Keypair.generate();
        console.log("newAuthority = ", newAuthority.publicKey.toBase58());
        await provider.connection.requestAirdrop(newAuthority.publicKey, 1000000000)

        // make this account real
        nonAuthority = anchor.web3.Keypair.generate();
        await provider.connection.requestAirdrop(nonAuthority.publicKey, 1000000000)

        // we'll be using this keypairs pubkey for part of the pda seeds
        groupKeypair = anchor.web3.Keypair.generate();

        const [account, bump] = await anchor.web3.PublicKey.findProgramAddress([
            groupKeypair.publicKey.toBytes(),
            keypair.publicKey.toBytes()
        ], program.programId);

        pdaPubkey = account;
        pdaBump = bump;

    })

    it("succeeds in creating a identity-verification record for a user", async () => {

        const txi = program.instruction.createRecord(pdaBump, groupKeypair.publicKey, {
            accounts: {
                signer: keypair.publicKey,
                record: pdaPubkey,
                systemProgram: anchor.web3.SystemProgram.programId,
                authority: authority.publicKey
            }
        });

        console.log(txi.data.byteLength);
        console.log(Uint8Array.from(txi.data));

        const tx = new Transaction()
        tx.add(txi);



        await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [keypair])

        // const tx = await program.rpc.createRecord(pdaBump, groupKeypair.publicKey, {
        //     accounts: {
        //         signer: keypair.publicKey,
        //         record: pdaPubkey,
        //         systemProgram: anchor.web3.SystemProgram.programId,
        //         authority: authority.publicKey
        //     },
        //     signers: [keypair],
        // });


        const accountInfo = await provider.connection.getAccountInfo(pdaPubkey);
        const accountMeta = await program.account.metadata.fetch(pdaPubkey);

        assert.equal(accountInfo.owner.toBase58(), program.programId.toBase58());
        assert.equal(accountMeta.iaStatus, 0);
        assert.equal(accountMeta.amlStatus, 0);
        assert.equal(accountMeta.kycStatus, 0);
        assert.equal(accountMeta.bump, pdaBump);
        assert.exists(tx);

    })
    ;

    it("is able to update an account's accreditation status", async () => {

        const tx = await program.rpc.updateIaStatus(pdaBump, groupKeypair.publicKey, 3, {
            accounts: {
                record: pdaPubkey,
                subject: keypair.publicKey,
                authority: authority.publicKey
            },
            signers: [authority],
        });

        const accountMeta = await program.account.metadata.fetch(pdaPubkey);

        assert.equal(accountMeta.iaStatus, 3);
        assert.exists(tx);

    });

    it("is able to update an account's kyc status", async () => {

        const tx = await program.rpc.updateKycStatus(pdaBump, groupKeypair.publicKey, 2, {
            accounts: {
                record: pdaPubkey,
                subject: keypair.publicKey,
                authority: authority.publicKey
            },
            signers: [authority],
        });

        const accountMeta = await program.account.metadata.fetch(pdaPubkey);

        assert.equal(accountMeta.kycStatus, 2);
        assert.exists(tx);


    });

    it("is able to update an account's aml status", async () => {

        const tx = await program.rpc.updateAmlStatus(pdaBump, groupKeypair.publicKey, 1, {
            accounts: {
                record: pdaPubkey,
                subject: keypair.publicKey,
                authority: authority.publicKey
            },
            signers: [authority],
        });

        const accountMeta = await program.account.metadata.fetch(pdaPubkey);

        assert.equal(accountMeta.amlStatus, 1);
        assert.exists(tx);


    });

    it("is not able to update an account's status to unknown status", async () => {

        const originalAccountMeta = await program.account.metadata.fetch(pdaPubkey);

        let accreditationStatus = originalAccountMeta.iaStatus;

        try {

            await program.rpc.updateIaStatus(pdaBump, groupKeypair.publicKey, 4, {
                accounts: {
                    record: pdaPubkey,
                    subject: keypair.publicKey,
                    authority: authority.publicKey
                },
                signers: [authority]
            });

        } catch (exception) {

            const error = exception.error;

            assert.equal(error.errorCode.code, "UnknownStatus");

        }

        const accountMeta = await program.account.metadata.fetch(pdaPubkey);

        assert.equal(accountMeta.iaStatus, accreditationStatus);


    });

    it("fails to update an account if the authority is not known", async () => {

        try {

            await program.rpc.updateIaStatus(pdaBump, groupKeypair.publicKey, 1, {
                accounts: {
                    record: pdaPubkey,
                    subject: keypair.publicKey,
                    authority: nonAuthority.publicKey
                },
                signers: [nonAuthority]
            });

        } catch (exception) {

            const error = exception.error;
            assert.equal(error.errorCode.code, "NotAuthorized");

        }

    });

    it("can transfer authority from one account to another", async () => {

        await program.rpc.transferAuthority(pdaBump, groupKeypair.publicKey, {
            accounts: {
                record: pdaPubkey,
                subject: keypair.publicKey,
                transferFrom: authority.publicKey,
                transferTo: newAuthority.publicKey
            },
            signers: [authority]
        });

        const accountMeta = await program.account.metadata.fetch(pdaPubkey);

        assert.equal(accountMeta.authority.toBase58(), newAuthority.publicKey.toBase58());

    });

});