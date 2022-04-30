import * as anchor from "@project-serum/anchor";
import {AnchorProvider, Program} from "@project-serum/anchor";
import {PermissionedList} from "../../target/types/permissioned_list";
import {Keypair, PublicKey, Transaction, LAMPORTS_PER_SOL} from "@solana/web3.js";

// const delay = (ms: number = 1) => new Promise(resolve => setTimeout(resolve, ms));

describe("permissioned-list-tests", () => {

    let program: Program<PermissionedList>;
    let provider: AnchorProvider;
    let signer: Keypair;
    let unknownSigner: Keypair;
    let user: Keypair;
    let group: Keypair;
    let pda: PublicKey;
    let bump: number

    beforeAll(async () => {

        provider = anchor.AnchorProvider.local()

        program = anchor.workspace.PermissionedList as Program<PermissionedList>;

        signer = Keypair.generate();
        const signerDropSignature = await provider.connection.requestAirdrop(signer.publicKey, LAMPORTS_PER_SOL * 2);
        await provider.connection.confirmTransaction(signerDropSignature);

        unknownSigner = Keypair.generate();
        const unknownSignerDropSignature = await provider.connection.requestAirdrop(unknownSigner.publicKey, LAMPORTS_PER_SOL * 2);
        await provider.connection.confirmTransaction(unknownSignerDropSignature);

        user = Keypair.generate();
        const userDropSignature = await provider.connection.requestAirdrop(user.publicKey, LAMPORTS_PER_SOL * 2);
        await provider.connection.confirmTransaction(userDropSignature);

        group = Keypair.generate();

        const [address, addressBump] = await PublicKey.findProgramAddress([
            group.publicKey.toBytes(),
            user.publicKey.toBytes()
        ], program.programId);

        pda = address;
        bump = addressBump;

    })

    test("can add user", async () => {

        expect.assertions(2)

        const [pda, bump] = await PublicKey.findProgramAddress([
            group.publicKey.toBytes(),
            user.publicKey.toBytes()
        ], program.programId);

        const txi = program.instruction.addUser(bump, group.publicKey, {
            accounts: {
                signer: signer.publicKey,
                pda,
                systemProgram: anchor.web3.SystemProgram.programId,
                user: user.publicKey
            }
        })

        const tx = new Transaction()
        tx.add(txi);

        const txs = await anchor.web3.sendAndConfirmTransaction(
            provider.connection,
            tx,
            [signer],
            {commitment: "confirmed"}
        )
        await provider.connection.confirmTransaction(txs);


        const accountInfo = await provider.connection.getAccountInfo(pda);

        expect(accountInfo.owner.toBase58()).toEqual(program.programId.toBase58());
        expect(txs).toBeDefined()

    })

    test("can get user", async () => {

        expect.assertions(1)

        const accountMeta = await program.account.metadata.fetch(pda);

        expect(accountMeta).toBeDefined()

    })

    test("cannot remove user with unknown signer", async () => {

        expect.assertions(1)

        const originalAccountInfo = await provider.connection.getAccountInfo(signer.publicKey);
        const originalBalance = originalAccountInfo.lamports;

        const txi = program.instruction.removeUser(bump, group.publicKey, {
            accounts: {
                signer: unknownSigner.publicKey,
                pda,
                user: user.publicKey
            }
        })

        const tx = new Transaction()
        tx.add(txi);

        try {
            const txs = await anchor.web3.sendAndConfirmTransaction(
                provider.connection,
                tx,
                [unknownSigner],
                {commitment: "confirmed"}
            )
        } catch (error) {

            expect(error).toBeDefined();

        }

    })

    test("can remove user with known signer", async () => {

        expect.assertions(1)

        const originalAccountInfo = await provider.connection.getAccountInfo(signer.publicKey);
        const originalBalance = originalAccountInfo.lamports;

        const txi = program.instruction.removeUser(bump, group.publicKey, {
            accounts: {
                signer: signer.publicKey,
                pda,
                user: user.publicKey
            }
        })

        const tx = new Transaction()
        tx.add(txi);

        const txs = await anchor.web3.sendAndConfirmTransaction(
            provider.connection,
            tx,
            [signer],
            {commitment: "confirmed"}
        )
        await provider.connection.confirmTransaction(txs);

        const newAccountInfo = await provider.connection.getAccountInfo(signer.publicKey);
        const newBalance = newAccountInfo.lamports;

        expect(newBalance).toBeGreaterThan(originalBalance);

    })

})