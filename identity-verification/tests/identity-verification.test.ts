import * as anchor from "@project-serum/anchor";
import {AnchorProvider, Program} from "@project-serum/anchor";
import {IdentityVerification} from "../../target/types/identity_verification";
import {Keypair, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import * as fs from "fs";
import {createAccount} from "../../utils/test/create-account";

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
        keypair = await createAccount(provider.connection);
        authority = await createAccount(provider.connection);
        newAuthority = await createAccount(provider.connection);
        nonAuthority = await createAccount(provider.connection);
        groupKeypair = anchor.web3.Keypair.generate();

        const [account, bump] = await anchor.web3.PublicKey.findProgramAddress([
            Buffer.from("identity"),
            groupKeypair.publicKey.toBytes(),
            keypair.publicKey.toBytes()
        ], program.programId);

        pdaPubkey = account;
        pdaBump = bump;

    })

    test("succeeds in creating a identity-verification record for a user", async () => {

        expect.assertions(6);

        const txi = await program.methods.createRecord(pdaBump, groupKeypair.publicKey)
            .accounts({
                signer: keypair.publicKey,
                record: pdaPubkey,
                systemProgram: anchor.web3.SystemProgram.programId,
                authority: authority.publicKey
            })
            .instruction();

        const tx = new Transaction()
        tx.add(txi);

        const sig = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [keypair])

        await provider.connection.confirmTransaction(sig);

        const accountInfo = await provider.connection.getAccountInfo(pdaPubkey);
        const accountMeta = await program.account.identityRecord.fetch(pdaPubkey);

        expect(accountInfo!.owner.toBase58()).toEqual(program.programId.toBase58());
        expect(accountMeta.iaStatus).toEqual(0);
        expect(accountMeta.amlStatus).toEqual(0);
        expect(accountMeta.kycStatus).toEqual(0);
        expect(accountMeta.bump).toEqual(pdaBump);
        expect(tx).toBeDefined();

    })

    test("is able to update an account's accreditation status", async () => {

        expect.assertions(1);

        await program.methods.updateIaStatus(pdaBump, groupKeypair.publicKey, 3)
            .accounts({
                record: pdaPubkey,
                subject: keypair.publicKey,
                authority: authority.publicKey
            })
            .signers([authority])
            .rpc();


        const accountMeta = await program.account.identityRecord.fetch(pdaPubkey);

        expect(accountMeta.iaStatus).toEqual(3);

    });

    test("is able to update an account's kyc status", async () => {

        expect.assertions(1);

        await program.methods.updateKycStatus(pdaBump, groupKeypair.publicKey, 2)

            .accounts({
                record: pdaPubkey,
                subject: keypair.publicKey,
                authority: authority.publicKey
            })
            .signers([authority])
            .rpc()


        const accountMeta = await program.account.identityRecord.fetch(pdaPubkey);

        expect(accountMeta.kycStatus).toEqual(2);


    });

    test("is able to update an account's aml status", async () => {

        expect.assertions(1);

        await program.methods.updateAmlStatus(pdaBump, groupKeypair.publicKey, 1)
            .accounts({
                record: pdaPubkey,
                subject: keypair.publicKey,
                authority: authority.publicKey
            })
            .signers([authority])
            .rpc()

        const accountMeta = await program.account.identityRecord.fetch(pdaPubkey);

        expect(accountMeta.amlStatus).toEqual(1);


    });

    test("is not able to update an account's status to unknown status", async () => {

        expect.assertions(2);

        const originalAccountMeta = await program.account.identityRecord.fetch(pdaPubkey);

        let accreditationStatus = originalAccountMeta.iaStatus;

        try {

            await program.methods.updateIaStatus(pdaBump, groupKeypair.publicKey, 4)

                .accounts({
                    record: pdaPubkey,
                    subject: keypair.publicKey,
                    authority: authority.publicKey
                })
                .signers([authority])
                .rpc();

        } catch (error) {

            expect(error).toBeDefined()

        }

        const accountMeta = await program.account.identityRecord.fetch(pdaPubkey);

        expect(accountMeta.iaStatus).toEqual(accreditationStatus);


    });

    test("fails to update an account if the authority is not known", async () => {

        expect.assertions(1);

        try {

            await program.methods.updateIaStatus(pdaBump, groupKeypair.publicKey, 1)
                .accounts({
                    record: pdaPubkey,
                    subject: keypair.publicKey,
                    authority: nonAuthority.publicKey
                })
                .signers([nonAuthority])
                .rpc()

        } catch (error) {

            expect(error).toBeDefined()

        }

    });

    test("can transfer authority from one account to another", async () => {

        expect.assertions(1);

        await program.methods.transferAuthority(pdaBump, groupKeypair.publicKey)
            .accounts({
                record: pdaPubkey,
                subject: keypair.publicKey,
                transferFrom: authority.publicKey,
                transferTo: newAuthority.publicKey
            })
            .signers([authority])
            .rpc();

        const accountMeta = await program.account.identityRecord.fetch(pdaPubkey);

        expect(accountMeta.authority.toBase58()).toEqual(newAuthority.publicKey.toBase58());

    });

    test("can delete account", async () => {

        expect.assertions(2);

        const accountInfoBefore = await program.provider.connection.getAccountInfo(keypair.publicKey);
        const preCloseLamports = accountInfoBefore?.lamports ?? 0

        const txsig = await program.methods.deleteRecord(pdaBump, groupKeypair.publicKey)
            .accounts({
                record: pdaPubkey,
                subject: keypair.publicKey,
                signer: newAuthority.publicKey
            })
            .signers([newAuthority])
            .rpc();

        await program.provider.connection.confirmTransaction(txsig);

        const accountInfoAfter = await program.provider.connection.getAccountInfo(keypair.publicKey);
        const postCloseLamports = accountInfoAfter?.lamports ?? 0

        expect(postCloseLamports).toBeGreaterThan(preCloseLamports);

        try {
            await program.account.identityRecord.fetch(pdaPubkey);
        } catch (error) {
            expect(error).toBeDefined()
        }


    });

});