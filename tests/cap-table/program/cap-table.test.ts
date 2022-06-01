import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {createMint, mintTo} from "@solana/spl-token";
import {createAccount} from "../../utils/create-account";
import {createAta} from "../../utils/create-ata";
import {transferTokens} from "../../utils/transfer-tokens";
import {AnchorProvider, Program} from "@project-serum/anchor";
import {CapTable} from "../../../target/types/cap_table"
import * as anchor from "@project-serum/anchor";

describe("cap table program", () => {

    let program: Program<CapTable>;
    let provider: AnchorProvider;
    let connection: Connection
    let mintAddress: PublicKey

    let ownerKeypair: Keypair
    let holder1: Keypair;
    let holder2: Keypair;
    let holder3: Keypair;

    let treasuryStockAccount: PublicKey

    beforeAll(async () => {

        anchor.setProvider(anchor.AnchorProvider.local());
        provider = anchor.AnchorProvider.local();
        program = anchor.workspace.IdentityVerification as Program<CapTable>;
        connection = provider.connection;

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

    test("cap table creation succeeds", async () => {

        const capTable = await program.methods.generate()
            .accounts({
                mint: mintAddress
            })
            .rpc();

        console.log(capTable);

    })

})