import * as anchor from "@project-serum/anchor";
import {AnchorProvider, Program} from "@project-serum/anchor";
import {PermissionedList} from "../../target/types/permissioned_list";
import {Keypair, PublicKey, Transaction, LAMPORTS_PER_SOL} from "@solana/web3.js";

describe("lists", () => {

    let program: Program<PermissionedList>;
    let provider: AnchorProvider;
    let signerKeypair: Keypair;
    let unknownSignerKeypair: Keypair;
    let userKeypair: Keypair;
    let listKeypair: Keypair;

    beforeAll(async () => {

        provider = anchor.AnchorProvider.local()

        program = anchor.workspace.PermissionedList as Program<PermissionedList>;

        signerKeypair = Keypair.generate();
        const signerDropSignature = await provider.connection.requestAirdrop(signerKeypair.publicKey, LAMPORTS_PER_SOL * 2);
        await provider.connection.confirmTransaction(signerDropSignature);

        unknownSignerKeypair = Keypair.generate();
        const unknownSignerDropSignature = await provider.connection.requestAirdrop(unknownSignerKeypair.publicKey, LAMPORTS_PER_SOL * 2);
        await provider.connection.confirmTransaction(unknownSignerDropSignature);

        userKeypair = Keypair.generate();
        const userDropSignature = await provider.connection.requestAirdrop(userKeypair.publicKey, LAMPORTS_PER_SOL * 2);
        await provider.connection.confirmTransaction(userDropSignature);

        listKeypair = Keypair.generate();

    })

    test("lists can be created", async () => {

        expect.assertions(2)

        const [pda, bump] = await PublicKey.findProgramAddress([
            Buffer.from("list", "utf-8"),
            signerKeypair.publicKey.toBytes()
        ], program.programId);

        const transactionInstruction = program.instruction.createList({
            accounts: {
                signer: signerKeypair.publicKey,
                list: pda,
                systemProgram: anchor.web3.SystemProgram.programId,
            }
        })

        const transaction = new Transaction()
        transaction.add(transactionInstruction);

        const transactionSignature = await anchor.web3.sendAndConfirmTransaction(
            provider.connection,
            transaction,
            [signerKeypair],
            {commitment: "confirmed"}
        )

        await provider.connection.confirmTransaction(transactionSignature);

        const accountInfo = await provider.connection.getAccountInfo(pda);

        expect(accountInfo.owner.toBase58()).toEqual(program.programId.toBase58());
        expect(transactionSignature).toBeDefined()

    });

    test("lists cannot be deleted by unknown signer", async () => {

        expect.assertions(1)

        const [pda] = await PublicKey.findProgramAddress([
            Buffer.from("list", "utf-8"),
            signerKeypair.publicKey.toBytes()
        ], program.programId);

        const transactionInstruction = program.instruction.deleteList({
            accounts: {
                signer: unknownSignerKeypair.publicKey,
                list: pda,
            }
        })

        const transaction = new Transaction()
        transaction.add(transactionInstruction);

        try {

            await anchor.web3.sendAndConfirmTransaction(
                provider.connection,
                transaction,
                [unknownSignerKeypair],
                {commitment: "confirmed"}
            )

        } catch (error) {

            expect(error).toBeDefined()

        }

    })

    test("lists can be deleted by known signer", async () => {

        expect.assertions(1)

        const [pda] = await PublicKey.findProgramAddress([
            Buffer.from("list", "utf-8"),
            signerKeypair.publicKey.toBytes()
        ], program.programId);

        const transactionInstruction = program.instruction.deleteList({
            accounts: {
                signer: signerKeypair.publicKey,
                list: pda,
            }
        })

        const transaction = new Transaction()
        transaction.add(transactionInstruction);

        const transactionSignature = await anchor.web3.sendAndConfirmTransaction(
            provider.connection,
            transaction,
            [signerKeypair],
            {commitment: "confirmed"}
        )

        await provider.connection.confirmTransaction(transactionSignature);

        expect(transactionSignature).toBeDefined()

    })

    describe("users", () => {

        let listPdaPublicKey: PublicKey;
        let listBump: number

        beforeAll(async () => {

            [listPdaPublicKey, listBump] = await PublicKey.findProgramAddress([
                Buffer.from("list", "utf-8"),
                signerKeypair.publicKey.toBytes()
            ], program.programId);

            const transactionInstruction = program.instruction.createList({
                accounts: {
                    signer: signerKeypair.publicKey,
                    list: listPdaPublicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                }
            })

            const transaction = new Transaction()
            transaction.add(transactionInstruction);

            const transactionSignature = await anchor.web3.sendAndConfirmTransaction(
                provider.connection,
                transaction,
                [signerKeypair],
                {commitment: "confirmed"}
            )

            await provider.connection.confirmTransaction(transactionSignature);

        })

        test("users cannot be added by unknown signer", async () => {

            expect.assertions(1)

            const [entryPdaPubkey] = await PublicKey.findProgramAddress([
                listPdaPublicKey.toBytes(),
                userKeypair.publicKey.toBytes()
            ], program.programId);

            const transactionInstruction = program.instruction.addUser({
                accounts: {
                    signer: unknownSignerKeypair.publicKey,
                    list: listPdaPublicKey,
                    entry: entryPdaPubkey,
                    user: userKeypair.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId
                }
            })

            const transaction = new Transaction()
            transaction.add(transactionInstruction);

            try {

                const transactionSignature = await anchor.web3.sendAndConfirmTransaction(
                    provider.connection,
                    transaction,
                    [unknownSignerKeypair],
                    {commitment: "confirmed"}
                )

                await provider.connection.confirmTransaction(transactionSignature);


            } catch (error) {

                expect(error).toBeDefined()

            }

        })

        test("users can be added", async () => {

            expect.assertions(2)

            const [entryPdaPubkey] = await PublicKey.findProgramAddress([
                listPdaPublicKey.toBytes(),
                userKeypair.publicKey.toBytes()
            ], program.programId);

            const transactionInstruction = program.instruction.addUser({
                accounts: {
                    signer: signerKeypair.publicKey,
                    list: listPdaPublicKey,
                    entry: entryPdaPubkey,
                    user: userKeypair.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId
                }
            })

            const transaction = new Transaction()
            transaction.add(transactionInstruction);

            const transactionSignature = await anchor.web3.sendAndConfirmTransaction(
                provider.connection,
                transaction,
                [signerKeypair],
                {commitment: "confirmed"}
            )

            await provider.connection.confirmTransaction(transactionSignature);

            const accountInfo = await provider.connection.getAccountInfo(entryPdaPubkey);

            expect(accountInfo.owner.toBase58()).toEqual(program.programId.toBase58());
            expect(transactionSignature).toBeDefined()

        })

        test("users cannot be removed by unknown signer", async () => {

            expect.assertions(1)

            const [entryPdaPubkey] = await PublicKey.findProgramAddress([
                listPdaPublicKey.toBytes(),
                userKeypair.publicKey.toBytes()
            ], program.programId);

            const transactionInstruction = program.instruction.removeUser({
                accounts: {
                    signer: unknownSignerKeypair.publicKey,
                    list: listPdaPublicKey,
                    entry: entryPdaPubkey,
                    user: userKeypair.publicKey,
                }
            })

            const transaction = new Transaction()
            transaction.add(transactionInstruction);

            try {

                const transactionSignature = await anchor.web3.sendAndConfirmTransaction(
                    provider.connection,
                    transaction,
                    [unknownSignerKeypair],
                    {commitment: "confirmed"}
                )

                await provider.connection.confirmTransaction(transactionSignature);


            } catch (error) {

                expect(error).toBeDefined()

            }

        })

        test("users can be removed", async () => {

            expect.assertions(1)

            const [entryPdaPubkey] = await PublicKey.findProgramAddress([
                listPdaPublicKey.toBytes(),
                userKeypair.publicKey.toBytes()
            ], program.programId);

            const transactionInstruction = program.instruction.removeUser({
                accounts: {
                    signer: signerKeypair.publicKey,
                    list: listPdaPublicKey,
                    entry: entryPdaPubkey,
                    user: userKeypair.publicKey,
                }
            })

            const transaction = new Transaction()
            transaction.add(transactionInstruction);


            const transactionSignature = await anchor.web3.sendAndConfirmTransaction(
                provider.connection,
                transaction,
                [signerKeypair],
                {commitment: "confirmed"}
            )

            await provider.connection.confirmTransaction(transactionSignature);

            expect(transactionSignature).toBeDefined()

        })

    })

})