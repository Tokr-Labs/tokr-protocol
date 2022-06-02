import {
    ConfirmOptions,
    Connection,
    Keypair,
    PublicKey,
    Signer,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    TransactionSignature
} from "@solana/web3.js";
import {Program, web3} from "@project-serum/anchor";
import {IdentityStatus} from "../models/identity-status";
import {IdentityVerification, IDL} from "../models/idl";
import {IdentityRecord} from "../models/identity-record";

export class IdentityVerificationService {

    // ============================================================
    // === Public API =============================================
    // ============================================================

    /**
     * Constructor
     * @param connection Connection to use for rpc calls
     * @param pid On-chain identity verification program id
     */
    constructor(
        private connection: Connection,
        private pid?: PublicKey
    ) {

        this.programId = pid ?? this.deterministicProgramId;

        this.program = new Program<IdentityVerification>(
            IDL,
            this.programId,
            {
                connection: this.connection
            }
        );

        this.program.provider.sendAndConfirm = function (tx: Transaction, signers?: Signer[], opts?: ConfirmOptions): Promise<TransactionSignature> {
            return web3.sendAndConfirmTransaction(connection, tx, signers!, opts)
        }

    }

    /**
     * Creates and identity verification record
     * @param signer The signer of the transaction and of whom the record will be created.
     * @param group The public key of the group this record belongs to.
     * @param authority The public key of the account who will have write access to the record.
     */
    async createRecordInstruction(
        signer: PublicKey,
        group: PublicKey,
        authority: PublicKey,
    ): Promise<TransactionInstruction> {

        const [record, bump] = await PublicKey.findProgramAddress(
            [
                Buffer.from("identity"),
                group.toBuffer(),
                signer.toBuffer(),
            ],
            this.programId
        );

        return await this.program.methods.createRecord(bump, group)
            .accounts({
                signer: signer,
                record: record,
                systemProgram: SystemProgram.programId,
                authority: authority
            })
            .instruction()

    }

    /**
     * Retrieves an identity verification record
     * @param user The user of whom the record is about.
     * @param group The public key of the group this record belongs to.
     */
    async getRecord(
        user: PublicKey,
        group: PublicKey,
    ): Promise<IdentityRecord> {

        const [record] = await PublicKey.findProgramAddress(
            [
                Buffer.from("identity"),
                group.toBuffer(),
                user.toBuffer(),
            ],
            this.programId
        );

        const info = await this.program.account.identityRecord.fetch(record);

        return IdentityRecord.with(info, record);

    }

    /**
     * Approve user's identity
     * @param user The user of whom the record is about.
     * @param group The public key of the group this record belongs to.
     * @param signer The authority over the record that will also sign the transaction
     */
    async approve(
        user: PublicKey,
        group: PublicKey,
        signer: Keypair
    ): Promise<TransactionSignature> {

        // this method is not available in the browser

        this.checkEnvironment()

        const [record, bump] = await PublicKey.findProgramAddress(
            [
                Buffer.from("identity"),
                group.toBuffer(),
                user.toBuffer(),
            ],
            this.programId
        );

        return await this.program.methods.approve(bump, group)
            .accounts({
                record: record,
                subject: user,
                authority: signer.publicKey
            })
            .signers([signer])
            .rpc()

    }

    /**
     * Deny user's identity
     * @param user The user of whom the record is about.
     * @param group The public key of the group this record belongs to.
     * @param signer The authority over the record that will also sign the transaction
     */
    async deny(
        user: PublicKey,
        group: PublicKey,
        signer: Keypair
    ): Promise<TransactionSignature> {

        // this method is not available in the browser

        this.checkEnvironment()

        const [record, bump] = await PublicKey.findProgramAddress(
            [
                Buffer.from("identity"),
                group.toBuffer(),
                user.toBuffer(),
            ],
            this.programId
        );

        return await this.program.methods.deny(bump, group)
            .accounts({
                record: record,
                subject: user,
                authority: signer.publicKey
            })
            .signers([signer])
            .rpc()

    }

    /**
     * Updates the investor accreditation status for the record
     * @param user The user of whom the record is about.
     * @param group The public key of the group this record belongs to.
     * @param signer The authority over the record that will also sign the transaction
     * @param status investor accreditation status
     */
    async updateIaStatus(
        user: PublicKey,
        group: PublicKey,
        signer: Keypair,
        status: IdentityStatus,
    ): Promise<TransactionSignature> {

        // this method is not available in the browser

        this.checkEnvironment()

        const [record, bump] = await PublicKey.findProgramAddress(
            [
                Buffer.from("identity"),
                group.toBuffer(),
                user.toBuffer(),
            ],
            this.programId
        );

        return await this.program.methods.updateIaStatus(bump, group, status)
            .accounts({
                record: record,
                subject: user,
                authority: signer.publicKey
            })
            .signers([signer])
            .rpc()

    }

    /**
     * Updates the investor kyc status for the record
     * @param user The user of whom the record is about.
     * @param group The public key of the group this record belongs to.
     * @param signer The authority over the record that will also sign the transaction
     * @param status kyc status
     */
    async updateKycStatus(
        user: PublicKey,
        group: PublicKey,
        signer: Keypair,
        status: IdentityStatus
    ): Promise<TransactionSignature> {

        // this method is not available in the browser

        this.checkEnvironment()

        const [record, bump] = await PublicKey.findProgramAddress(
            [
                Buffer.from("identity"),
                group.toBuffer(),
                user.toBuffer(),
            ],
            this.programId
        );

        return await this.program.methods.updateKycStatus(bump, group, status)
            .accounts({
                record: record,
                subject: user,
                authority: signer.publicKey
            })
            .signers([signer])
            .rpc()

    }

    /**
     * Updates the investor aml status for the record
     * @param user The user of whom the record is about.
     * @param group The public key of the group this record belongs to.
     * @param signer The authority over the record that will also sign the transaction
     * @param status aml status
     */
    async updateAmlStatus(
        user: PublicKey,
        group: PublicKey,
        signer: Keypair,
        status: IdentityStatus,
    ): Promise<TransactionSignature> {

        // this method is not available in the browser

        this.checkEnvironment()

        const [record, bump] = await PublicKey.findProgramAddress(
            [
                Buffer.from("identity"),
                group.toBuffer(),
                user.toBuffer(),
            ],
            this.programId
        );

        return await this.program.methods.updateAmlStatus(bump, group, status)
            .accounts({
                record: record,
                subject: user,
                authority: signer.publicKey
            })
            .signers([signer])
            .rpc();

    }

    /**
     * Transfers the authority of the record to another account
     * @param user The user of whom the record is about.
     * @param group The public key of the group this record belongs to.
     * @param currentAuthority The public key of the account that currently has update authority.
     * @param newAuthority The public key that update authority will be given to.
     */
    async transferAuthority(
        user: PublicKey,
        group: PublicKey,
        currentAuthority: Keypair,
        newAuthority: PublicKey,
    ): Promise<TransactionSignature> {

        // this method is not available in the browser

        this.checkEnvironment()

        const [record, bump] = await PublicKey.findProgramAddress(
            [
                Buffer.from("identity"),
                group.toBuffer(),
                user.toBuffer(),
            ],
            this.programId
        );

        return await this.program.methods.transferAuthority(bump, group)
            .accounts({
                record: record,
                subject: user,
                transferTo: newAuthority,
                transferFrom: currentAuthority.publicKey
            })
            .signers([currentAuthority])
            .rpc()

    }

    /**
     * Deletes a record of the passed user account. It also returns the rent to the user whom it's about.
     * @param user The user of whom the record is about.
     * @param group The public key of the group this record belongs to.
     * @param signer The keypair of the account that currently has update authority.
     */
    async deleteRecord(
        user: PublicKey,
        group: PublicKey,
        signer: Keypair
    ): Promise<TransactionSignature> {

        // this method is not available in the browser

        this.checkEnvironment()

        const [record, bump] = await PublicKey.findProgramAddress(
            [
                Buffer.from("identity"),
                group.toBuffer(),
                user.toBuffer(),
            ],
            this.programId
        );

        return await this.program.methods.deleteRecord(bump, group)
            .accounts({
                record: record,
                signer: signer.publicKey,
                subject: user
            })
            .signers([signer])
            .rpc()

    }

    // ============================================================
    // === Private API ============================================
    // ============================================================

    // Private Properties

    private program: Program<IdentityVerification>
    private readonly programId: PublicKey;

    /**
     * Based on the rpc endpoint this will determine what program id to use in the methods.
     * @private
     */
    private get deterministicProgramId(): PublicKey {

        if (this.connection.rpcEndpoint.search(/dev/gi)) {
            return new PublicKey("5WJNeGKQQJMaTCPgtXhmsiEK4bA6dLT94smLFmTU8Gh9")
        } else {
            return new PublicKey("idv2F375xYuz2K7a7LxcrkhgWbPsJgpuWD3XLW1AFdD")
        }

    }

    // Private Methods

    /**
     * Checks the current environment, only certain methods are callable from the browser
     * @private
     */
    private checkEnvironment() {
        if ((typeof window !== "undefined" && !window.process?.hasOwnProperty("type"))) {
            throw new Error("This method is not supported in the browser")
        }
    }


}
