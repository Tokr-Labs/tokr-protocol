import {Connection, Keypair} from "@solana/web3.js";
import {expect} from "chai";
import {createRecordInstruction} from "../src";

test("'createRecordInstruction' returns a record instruction", async () => {

    const signer = Keypair.generate();
    const group = Keypair.generate();
    const authority = Keypair.generate();
    const connection = new Connection("http://locahost:8899")
    const tx = await createRecordInstruction(
        connection,
        signer.publicKey,
        group.publicKey,
        authority.publicKey
    );

    expect(tx).to.exist

});