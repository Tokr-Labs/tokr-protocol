import * as anchor from "@project-serum/anchor";
import {AnchorProvider, Program} from "@project-serum/anchor";
import {IdentityVerification} from "../../target/types/identity_verification";
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

    beforeAll(async () => {

        anchor.setProvider(anchor.AnchorProvider.local());
        provider = anchor.AnchorProvider.local();
        program = anchor.workspace.IdentityVerification as Program<IdentityVerification>;

        let contents = fs.readFileSync(process.env.ANCHOR_WALLET!);
        let parsed = String(contents)
            .replace("[", "")
            .replace("]", "")
            .split(",")
            .map((item) => Number(item))

        const uint8Array = Uint8Array.from(parsed);
        keypair = anchor.web3.Keypair.fromSecretKey(uint8Array);

        // make this account real
        authority = anchor.web3.Keypair.generate();
        await provider.connection.requestAirdrop(authority.publicKey, 1000000000)

        // make this account real
        newAuthority = anchor.web3.Keypair.generate();
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

    test("succeeds in creating a identity-verification record for a user", async () => {

        expect.assertions(6);

        const txi = program.instruction.createRecord(pdaBump, groupKeypair.publicKey, {
            accounts: {
                signer: keypair.publicKey,
                record: pdaPubkey,
                systemProgram: anchor.web3.SystemProgram.programId,
                authority: authority.publicKey
            }
        });

        const tx = new Transaction()
        tx.add(txi);

        const sig = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [keypair])

        await provider.connection.confirmTransaction(sig);

        const accountInfo = await provider.connection.getAccountInfo(pdaPubkey);
        const accountMeta = await program.account.metadata.fetch(pdaPubkey);

        expect(accountInfo!.owner.toBase58()).toEqual(program.programId.toBase58());
        expect(accountMeta.iaStatus).toEqual(0);
        expect(accountMeta.amlStatus).toEqual(0);
        expect(accountMeta.kycStatus).toEqual(0);
        expect(accountMeta.bump).toEqual(pdaBump);
        expect(tx).toBeDefined();

    })

    test("is able to update an account's accreditation status", async () => {

        expect.assertions(2);

        const tx = await program.rpc.updateIaStatus(pdaBump, groupKeypair.publicKey, 3, {
            accounts: {
                record: pdaPubkey,
                subject: keypair.publicKey,
                authority: authority.publicKey
            },
            signers: [authority],
        });

        await provider.connection.confirmTransaction(tx);

        const accountMeta = await program.account.metadata.fetch(pdaPubkey);

        expect(accountMeta.iaStatus).toEqual(3);
        expect(tx).toBeDefined();

    });

    test("is able to update an account's kyc status", async () => {

        expect.assertions(2);

        const tx = await program.rpc.updateKycStatus(pdaBump, groupKeypair.publicKey, 2, {
            accounts: {
                record: pdaPubkey,
                subject: keypair.publicKey,
                authority: authority.publicKey
            },
            signers: [authority],
        });

        await provider.connection.confirmTransaction(tx);

        const accountMeta = await program.account.metadata.fetch(pdaPubkey);

        expect(accountMeta.kycStatus).toEqual(2);
        expect(tx).toBeDefined();


    });

    test("is able to update an account's aml status", async () => {

        expect.assertions(2);

        const tx = await program.rpc.updateAmlStatus(pdaBump, groupKeypair.publicKey, 1, {
            accounts: {
                record: pdaPubkey,
                subject: keypair.publicKey,
                authority: authority.publicKey
            },
            signers: [authority],
        });

        await provider.connection.confirmTransaction(tx);

        const accountMeta = await program.account.metadata.fetch(pdaPubkey);

        expect(accountMeta.amlStatus).toEqual(1);
        expect(tx).toBeDefined();


    });

    test("is not able to update an account's status to unknown status", async () => {

        expect.assertions(2);

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

        } catch (error) {

            expect(error).toBeDefined()

        }

        const accountMeta = await program.account.metadata.fetch(pdaPubkey);

        expect(accountMeta.iaStatus).toEqual(accreditationStatus);


    });

    test("fails to update an account if the authority is not known", async () => {

        expect.assertions(1);

        try {

            await program.rpc.updateIaStatus(pdaBump, groupKeypair.publicKey, 1, {
                accounts: {
                    record: pdaPubkey,
                    subject: keypair.publicKey,
                    authority: nonAuthority.publicKey
                },
                signers: [nonAuthority]
            });

        } catch (error) {

            expect(error).toBeDefined()

        }

    });

    test("can transfer authority from one account to another", async () => {

        expect.assertions(1);

        const tx = await program.rpc.transferAuthority(pdaBump, groupKeypair.publicKey, {
            accounts: {
                record: pdaPubkey,
                subject: keypair.publicKey,
                transferFrom: authority.publicKey,
                transferTo: newAuthority.publicKey
            },
            signers: [authority]
        });

        await provider.connection.confirmTransaction(tx);

        const accountMeta = await program.account.metadata.fetch(pdaPubkey);

        expect(accountMeta.authority.toBase58()).toEqual(newAuthority.publicKey.toBase58());

    });

});