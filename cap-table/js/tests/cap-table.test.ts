import {determineCapTableForToken} from "../src";
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    Transaction
} from "@solana/web3.js";
import {
    createAssociatedTokenAccount,
    createMint,
    createTransferInstruction,
    mintTo,
    TOKEN_PROGRAM_ID,
    transfer
} from "@solana/spl-token";
import {CapTable} from "../src/models/cap-table";
import {first, where} from "underscore";
import {helper_createAccount, helper_createAtaForKeypair, helper_transferTokens} from "./utils/helpers";


describe("cap table", () => {

    let connection: Connection
    let mintAddress: PublicKey

    let ownerKeypair: Keypair
    let holder1: Keypair;
    let holder2: Keypair;
    let holder3: Keypair;

    let treasuryStockAccount: PublicKey

    beforeAll(async () => {

        connection = new Connection("http://localhost:8899", "recent")

        ownerKeypair = await helper_createAccount(connection);
        holder1 = await helper_createAccount(connection);
        holder2 = await helper_createAccount(connection);
        holder3 = await helper_createAccount(connection);

        // create mint

        mintAddress = await createMint(
            connection,
            ownerKeypair,
            ownerKeypair.publicKey,
            null,
            0
        )

        // create mint ata

        treasuryStockAccount = await helper_createAtaForKeypair(connection, mintAddress, ownerKeypair)
        const holder1Ata = await helper_createAtaForKeypair(connection, mintAddress, holder1)
        const holder2Ata = await helper_createAtaForKeypair(connection, mintAddress, holder2)
        const holder3Ata = await helper_createAtaForKeypair(connection, mintAddress, holder3)

        // mint to ata

        await mintTo(
            connection,
            ownerKeypair,
            mintAddress,
            treasuryStockAccount,
            ownerKeypair,
            1000
        )

        await helper_transferTokens(connection, ownerKeypair, treasuryStockAccount, holder1Ata, 150) // 150
        await helper_transferTokens(connection, ownerKeypair, treasuryStockAccount, holder2Ata, 300) // 450
        await helper_transferTokens(connection, ownerKeypair, treasuryStockAccount, holder3Ata, 450) // 900

    })

    test("test that cap table is calculated correctly", async () => {

        expect.assertions(8)

        const capTable: CapTable = await determineCapTableForToken(
            connection,
            mintAddress,
            treasuryStockAccount,
            [
                ownerKeypair.publicKey
            ]
        );

        // @ts-ignore
        let holder1Entry = where(capTable.entries, {holder: holder1.publicKey.toBase58()})[0];
        // @ts-ignore
        let holder2Entry = where(capTable.entries, {holder: holder2.publicKey.toBase58()})[0];
        // @ts-ignore
        let holder3Entry = where(capTable.entries, {holder: holder3.publicKey.toBase58()})[0];

        expect(holder1Entry.tokensHeld).toEqual(150);
        expect(holder1Entry.percentHeld).toBeCloseTo(0.17);

        expect(holder2Entry.tokensHeld).toEqual(300);
        expect(holder2Entry.percentHeld).toBeCloseTo(0.33);

        expect(holder3Entry.tokensHeld).toEqual(450);
        expect(holder3Entry.percentHeld).toBeCloseTo(0.5);

        expect(capTable.supply).toEqual(1000);
        expect(capTable.outstanding).toEqual(100);

    });

});