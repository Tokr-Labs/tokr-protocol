import {createRecordInstruction} from "../src";
import {Connection, Keypair} from "@solana/web3.js";
import {expect} from "chai";

test("'createRecordInstruction' returns a record instruction", async () => {

    const signer = Keypair.generate();
    const group = Keypair.generate();
    const authority = Keypair.generate();

    const tix = await createRecordInstruction(
        signer.publicKey,
        group.publicKey,
        authority.publicKey
    );

    expect(tix).to.exist

});