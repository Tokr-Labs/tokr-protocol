import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {createMint, mintTo} from "@solana/spl-token";
import {where} from "underscore";
import {createAccount} from "../utils/create-account";
import {createAta} from "../utils/create-ata";
import {transferTokens} from "../utils/transfer-tokens";
import {CapTable} from "../../programs/cap-table/js/src/models/cap-table";
import {determineCapTableForToken} from "../../programs/cap-table/js/src";

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

        ownerKeypair = await createAccount(connection);
        holder1 = await createAccount(connection);
        holder2 = await createAccount(connection);
        holder3 = await createAccount(connection);

        // create mint

        mintAddress = await createMint(
            connection,
            ownerKeypair,
            ownerKeypair.publicKey,
            null,
            0
        )

        // create mint ata

        treasuryStockAccount = await createAta(connection, mintAddress, ownerKeypair)
        const holder1Ata = await createAta(connection, mintAddress, holder1)
        const holder2Ata = await createAta(connection, mintAddress, holder2)
        const holder3Ata = await createAta(connection, mintAddress, holder3)

        // mint to ata

        await mintTo(
            connection,
            ownerKeypair,
            mintAddress,
            treasuryStockAccount,
            ownerKeypair,
            1000
        )

        await transferTokens(connection, ownerKeypair, treasuryStockAccount, holder1Ata, 150) // 150
        await transferTokens(connection, ownerKeypair, treasuryStockAccount, holder2Ata, 300) // 450
        await transferTokens(connection, ownerKeypair, treasuryStockAccount, holder3Ata, 450) // 900

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

        expect(capTable.authorizedSupply).toEqual(1000);
        expect(capTable.reservedSupply).toEqual(100);

    });

});