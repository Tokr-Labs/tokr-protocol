import * as anchor from "@project-serum/anchor";
import {AnchorProvider, Program, Wallet} from "@project-serum/anchor";
import {Whitelist} from "../../target/types/whitelist";
import * as fs from "fs";
import path from "path";
import {assert} from "chai";
import {Keypair} from "@solana/web3.js";

describe("that whitelist program", () => {

    let program: Program<Whitelist>;
    let provider: AnchorProvider;
    let keypair: Keypair;

    before(() => {

        anchor.setProvider(anchor.AnchorProvider.local());
        provider = anchor.AnchorProvider.local();
        program = anchor.workspace.Whitelist as Program<Whitelist>;

        const uint8Array = Uint8Array.from([173, 92, 178, 82, 92, 67, 74, 73, 247, 233, 86, 55, 143, 102, 109, 239, 9, 155, 139, 189, 237, 99, 29, 39, 78, 103, 219, 32, 19, 179, 114, 129, 139, 40, 81, 87, 86, 12, 108, 76, 39, 117, 87, 83, 23, 182, 68, 90, 172, 109, 29, 144, 19, 246, 192, 142, 212, 208, 1, 37, 253, 84, 246, 145]);
        keypair = anchor.web3.Keypair.fromSecretKey(uint8Array);

    })

    it("succeeds in initializing a whitelist record for user", async () => {

        const [account, bump] = await anchor.web3.PublicKey.findProgramAddress([
            Buffer.from('whitelist'),
            provider.wallet.publicKey.toBytes()
        ], program.programId);

        const tx = await program.rpc.initialize(bump, {
            accounts: {
                signer: keypair.publicKey,
                whitelistAccount: account,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [keypair],
        });

        const accountInfo = await program.account.metadata.fetch(account);

        assert.equal(accountInfo.status, 0);
        assert.equal(accountInfo.bump, bump);
        assert.exists(tx);

    });

    it("is able to update an account's status", async () => {

        assert.fail("not implemented")

    });

    it("is able to delete the account", async () => {

        assert.fail("not implemented")

    });

    it("is not able to be updated maliciously", async () => {

        assert.fail("not implemented")

    });


});