import {determineCapTableForToken} from "../src";
import {Connection, PublicKey} from "@solana/web3.js";
import {CapTable} from "../src/cap-table";

test("cap-table", async () => {

    expect.assertions(1)

    const connection = new Connection("http://localhost:8899", "recent")
    const splTokenMint = new PublicKey("GLgjt8zEJwuYAKg9tLy9ZTCC9k7VUf46yfx7EQuDXdzf");


    const captable: CapTable = await determineCapTableForToken(connection, splTokenMint);


    console.log(captable);

    expect(true).toBeTruthy()

});