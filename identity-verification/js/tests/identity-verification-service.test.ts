import {IdentityVerificationService} from "../src/services/identity-verification-service";
import {Connection, PublicKey} from "@solana/web3.js";

describe("identity verification tests", () => {

    let service: IdentityVerificationService;
    let connection = new Connection("http://localhost:8899")
    let programId = new PublicKey("3YC2irJKAzmuqeg2Qf9v8YBb1ufGmYTuvggxqv4bCyST")

    beforeAll(async () => {

        service = new IdentityVerificationService(connection, programId);

    });

    test("that record can be created", async () => {


    })

});