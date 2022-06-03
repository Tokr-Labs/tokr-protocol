import {Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction} from "@solana/web3.js";
import {createAccount} from "../../utils/create-account";
import {
    IdentityVerificationService
} from "../../../programs/identity-verification/client/src/services/identity-verification-service";
import {
    createIdentityRecordInstruction,
    getIdentityVerificationRecord
} from "../../../programs/identity-verification/client/src";
import {IdentityRecord} from "../../../programs/identity-verification/client/src/models/identity-record";
import {IdentityStatus} from "../../../programs/identity-verification/client/src/models/identity-status";

describe("identity verification tests", () => {

    let service: IdentityVerificationService;
    let connection: Connection;
    let programId = new PublicKey("3YC2irJKAzmuqeg2Qf9v8YBb1ufGmYTuvggxqv4bCyST")

    let ownerKeypair: Keypair
    let authorized: Keypair
    let alsoAuthorized: Keypair
    let unauthorized: Keypair
    let groupId: PublicKey;

    beforeAll(async () => {

        connection = new Connection("http://localhost:8899", "recent")

        ownerKeypair = await createAccount(connection);
        authorized = await createAccount(connection);
        alsoAuthorized = await createAccount(connection);
        unauthorized = await createAccount(connection);
        groupId = Keypair.generate().publicKey
        service = new IdentityVerificationService(connection, programId)

    });

    test("that record can be created", async () => {

        expect.assertions(4);

        const tix = await createIdentityRecordInstruction(
            connection,
            programId,
            ownerKeypair.publicKey,
            groupId,
            authorized.publicKey
        );

        const tx = new Transaction();
        tx.add(tix);
        tx.feePayer = ownerKeypair.publicKey

        const sig = await sendAndConfirmTransaction(connection, tx, [ownerKeypair]);
        await connection.confirmTransaction(sig);
        const record = await service.getRecord(ownerKeypair.publicKey, groupId);

        expect(record.kycStatus).toEqual(IdentityStatus.initial);
        expect(record.amlStatus).toEqual(IdentityStatus.initial);
        expect(record.iaStatus).toEqual(IdentityStatus.initial);
        expect(record.authority).toEqual(authorized.publicKey);

    });

    test("that record can be updated", async () => {

        expect.assertions(1);

        try {
            const sig = await service.updateAmlStatus(ownerKeypair.publicKey, groupId, authorized, IdentityStatus.approved);
            await connection.confirmTransaction(sig);
        } catch {
            // ...
        }

        const record = await getIdentityVerificationRecord(
            connection,
            programId,
            ownerKeypair.publicKey,
            groupId
        )

        expect(record.amlStatus).toEqual(IdentityStatus.approved);

    });

    test("that record can be denied", async () => {

        expect.assertions(1);

        try {
            const sig = await service.deny(ownerKeypair.publicKey, groupId, authorized);
            await connection.confirmTransaction(sig);
        } catch {
            // ...
        }

        const record = await getIdentityVerificationRecord(
            connection,
            programId,
            ownerKeypair.publicKey,
            groupId
        )

        expect(record.isVerified).toBeFalsy()

    });

    test("that record can be approved", async () => {

        expect.assertions(1);

        try {
            const sig = await service.approve(ownerKeypair.publicKey, groupId, authorized);
            await connection.confirmTransaction(sig);
        } catch {
            // ...
        }

        const record = await getIdentityVerificationRecord(
            connection,
            programId,
            ownerKeypair.publicKey,
            groupId
        )

        expect(record.isVerified).toBeTruthy()

    });

    test("that record cannot be updated by unrecognized authority", async () => {

        expect.assertions(2);

        try {
            const sig = await service.updateAmlStatus(ownerKeypair.publicKey, groupId, unauthorized, IdentityStatus.denied);
            await connection.confirmTransaction(sig);
        } catch (error) {
            expect(error).toBeDefined()
            const record = await service.getRecord(ownerKeypair.publicKey, groupId)
            expect(record.amlStatus).not.toEqual(IdentityStatus.denied);
        }

    });

    test("is verified", async () => {

        expect.assertions(2);

        const preRecord = await service.getRecord(ownerKeypair.publicKey, groupId)
        expect(preRecord.isVerified).toBeTruthy()

        try {
            const sig = await service.deny(ownerKeypair.publicKey, groupId, authorized);
            await connection.confirmTransaction(sig);
        } catch {
            // ...
        }

        const postRecord = await service.getRecord(ownerKeypair.publicKey, groupId)

        expect(postRecord.isVerified).toBeFalsy()

    });

    test("that record can transfer authority", async () => {

        expect.assertions(1);

        try {
            const sig = await service.transferAuthority(ownerKeypair.publicKey, groupId, authorized, alsoAuthorized.publicKey);
            await connection.confirmTransaction(sig);
        } catch {
            // ...
        }

        const record = await service.getRecord(ownerKeypair.publicKey, groupId)

        expect(record.authority).toEqual(alsoAuthorized.publicKey);

    });

    test("that record can be closed", async () => {

        expect.assertions(1);

        const sig = await service.deleteRecord(ownerKeypair.publicKey, groupId, alsoAuthorized);
        await connection.confirmTransaction(sig);

        try {
            await service.getRecord(ownerKeypair.publicKey, groupId)
        } catch (error) {
            expect(error).toBeDefined();
        }


    });

    describe("combined status returns as expected", () => {

        test("when no statuses are initial", () => {

            const record = IdentityRecord.with(
                {
                    amlStatus: 0,
                    iaStatus: 0,
                    kycStatus: 0,
                    bump: 0,
                    authority: Keypair.generate().publicKey
                },
                Keypair.generate().publicKey
            );

            expect(record.status).toEqual(IdentityStatus.initial)

        })

        test("when statuses are started", () => {

            const record = IdentityRecord.with(
                {
                    amlStatus: 1,
                    iaStatus: 1,
                    kycStatus: 0,
                    bump: 0,
                    authority: Keypair.generate().publicKey
                },
                Keypair.generate().publicKey
            );

            expect(record.status).toEqual(IdentityStatus.started)

        })

        test("when any status has been denied", () => {

            const record = IdentityRecord.with(
                {
                    amlStatus: 1,
                    iaStatus: 3,
                    kycStatus: 0,
                    bump: 0,
                    authority: Keypair.generate().publicKey
                },
                Keypair.generate().publicKey
            );

            expect(record.status).toEqual(IdentityStatus.denied)

        })

        test("when some statuses are approved", () => {

            const record = IdentityRecord.with(
                {
                    amlStatus: 2,
                    iaStatus: 2,
                    kycStatus: 1,
                    bump: 0,
                    authority: Keypair.generate().publicKey
                },
                Keypair.generate().publicKey
            );

            expect(record.status).toEqual(IdentityStatus.started)

        })

        test("when all statuses are approved", () => {

            const record = IdentityRecord.with(
                {
                    amlStatus: 2,
                    iaStatus: 2,
                    kycStatus: 2,
                    bump: 0,
                    authority: Keypair.generate().publicKey
                },
                Keypair.generate().publicKey
            );

            expect(record.status).toEqual(IdentityStatus.approved)

        })

    })

});