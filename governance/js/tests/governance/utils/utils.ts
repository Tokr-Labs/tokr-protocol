// helper methods

import {
    Connection,
    Keypair, LAMPORTS_PER_SOL, PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction,
    createInitializeMintInstruction, createMintToInstruction,
    getOrCreateAssociatedTokenAccount,
    MintLayout, mintTo,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import {BN} from "bn.js";
import {
    GovernanceConfig,
    MintMaxVoteWeightSource,
    withCreateGovernance, withCreateMintGovernance,
    withCreateRealm,
    withDepositGoverningTokens, withSetRealmAuthority
} from "../../../src";
import path from "path";
import process from "process";
import fs from "fs";

export const createMintInstructions = async (
    instructions: TransactionInstruction[],
    connection: Connection,
    mintKeypair: Keypair,
    ownerKeypair: Keypair,
    decimals: number
) => {

    const mintRentExempt = await connection.getMinimumBalanceForRentExemption(
        MintLayout.span
    )

    const createAccountTransactionInstruction = SystemProgram.createAccount({
        fromPubkey: ownerKeypair.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        lamports: mintRentExempt,
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID
    })

    const createMintTransactionInstruction = createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        ownerKeypair.publicKey,
        null
    )

    instructions.push(
        createAccountTransactionInstruction,
        createMintTransactionInstruction
    )

}

export const executeMintInstructions = async (
    connection: Connection,
    instructions: TransactionInstruction[],
    mintKeypairs: Keypair[],
    ownerKeypair: Keypair
) => {

    const mintTransaction = new Transaction();

    mintTransaction.add(...instructions)
    mintTransaction.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(
        connection,
        mintTransaction,
        [...mintKeypairs, ownerKeypair],
    )

    return true

}

export const mintDelegateTokenForDelegate = async (
    connection: Connection,
    ownerKeypair: Keypair,
    delegateMintPublicKey: PublicKey,
    delegateKeypair: Keypair
) => {

    const delegateAta = await getOrCreateAssociatedTokenAccount(
        connection,
        ownerKeypair,
        delegateMintPublicKey,
        delegateKeypair.publicKey
    )

    const mintToTransactionInstruction = createMintToInstruction(
        delegateMintPublicKey,
        delegateAta.address,
        ownerKeypair.publicKey,
        1
    )

    const mintToTransaction = new Transaction()

    mintToTransaction.add(mintToTransactionInstruction)
    mintToTransaction.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(
        connection,
        mintToTransaction,
        [ownerKeypair],
    )

}

export const mintMaxLpTokens = async (
    connection: Connection,
    payer: Keypair,
    mint: PublicKey,
    owner: PublicKey,
    amount: number
) => {

    const ownerAta = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        owner
    )

    await mintTo(
        connection,
        payer,
        mint,
        ownerAta.address,
        owner,
        amount
    )

    return ownerAta.address

}

export const createRealm = async (
    connection: Connection,
    governanceProgramId: PublicKey,
    ownerKeypair: Keypair,
    councilMintPublicKey: PublicKey,
    communityMintPublicKey: PublicKey,
    name: string,
) => {

    let transactionInstructions: TransactionInstruction[] = []

    const minCommunityWeightToCreateGovernance = new BN(LAMPORTS_PER_SOL * 1000000);

    const realmAddress = await withCreateRealm(
        transactionInstructions,
        governanceProgramId,
        2,
        name,
        ownerKeypair.publicKey,
        communityMintPublicKey,
        ownerKeypair.publicKey,
        councilMintPublicKey,
        MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION,
        minCommunityWeightToCreateGovernance
    )

    const tx = new Transaction();

    tx.add(...transactionInstructions);
    tx.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair])

    return realmAddress

}

export const createTreasuryAccount = async (
    connection: Connection,
    ownerKeypair: Keypair,
    mintPublicKey: PublicKey,
    governancePublicKey: PublicKey
) => {

    const mintAtaPublicKey = (await PublicKey.findProgramAddress(
        [
            governancePublicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mintPublicKey.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];

    const transactionInstruction = createAssociatedTokenAccountInstruction(
        ownerKeypair.publicKey,
        mintAtaPublicKey,
        governancePublicKey,
        mintPublicKey
    )

    const tx = new Transaction();

    tx.add(transactionInstruction);
    tx.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair])

    return mintAtaPublicKey;

}

export const depositDelegateCouncilTokenInGovernance = async (
    connection: Connection,
    governanceProgramId: PublicKey,
    delegateKeypair: Keypair,
    ownerKeypair: Keypair,
    realmPublicKey: PublicKey,
    delegateMintPublicKey: PublicKey,
) => {

    let instruction: TransactionInstruction[] = [];

    const delegateAta = await getOrCreateAssociatedTokenAccount(
        connection,
        ownerKeypair,
        delegateMintPublicKey,
        delegateKeypair.publicKey
    )

    await withDepositGoverningTokens(
        instruction,
        governanceProgramId,
        2, // why does program 2 work and not program 1
        realmPublicKey,
        delegateAta.address,
        delegateMintPublicKey,
        delegateKeypair.publicKey,
        delegateKeypair.publicKey,
        delegateKeypair.publicKey,
        new BN(1)
    )

    const tx = new Transaction();

    tx.add(...instruction);
    tx.feePayer = delegateKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [delegateKeypair])

}

export const createGovernances = async (
    connection: Connection,
    governanceProgramId: PublicKey,
    governanceConfig: GovernanceConfig,
    ownerKeypair: Keypair,
    realmPublicKey: PublicKey,
    delegateMintPublicKey: PublicKey,
    limitedPartnerMintPublicKey: PublicKey,
    distributionMintPublicKey: PublicKey
) => {

    const [tokenOwnerRecordAddress] = await PublicKey.findProgramAddress(
        [
            governanceProgramId.toBuffer(),
            realmPublicKey.toBuffer(),
            delegateMintPublicKey.toBuffer(),
            ownerKeypair.publicKey.toBuffer(),
        ],
        governanceProgramId,
    );

    const instructions: TransactionInstruction[] = []

    const limitedPartnerGovernancePublicKey = await withCreateGovernance(
        instructions,
        governanceProgramId,
        2,
        realmPublicKey,
        undefined,
        governanceConfig,
        tokenOwnerRecordAddress,
        ownerKeypair.publicKey,
        ownerKeypair.publicKey
    )

    const delegateMintGovernancePublicKey = await withCreateMintGovernance(
        instructions,
        governanceProgramId,
        2,  // why does program 2 work and not program 1
        realmPublicKey,
        delegateMintPublicKey,
        governanceConfig,
        !!ownerKeypair.publicKey,
        ownerKeypair.publicKey,
        tokenOwnerRecordAddress,
        ownerKeypair.publicKey,
        ownerKeypair.publicKey
    )

    const distributionMintGovernancePublicKey = await withCreateMintGovernance(
        instructions,
        governanceProgramId,
        2,  // why does program 2 work and not program 1
        realmPublicKey,
        distributionMintPublicKey,
        governanceConfig,
        !!ownerKeypair.publicKey,
        ownerKeypair.publicKey,
        tokenOwnerRecordAddress,
        ownerKeypair.publicKey,
        ownerKeypair.publicKey
    )

    const tx = new Transaction();

    tx.add(...instructions);
    tx.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair], {
        skipPreflight: true
    })

    return {
        limitedPartnerGovernancePublicKey,
        delegateMintGovernancePublicKey,
        distributionMintGovernancePublicKey
    }

}

export const setLimitedPartnerGovernanceAsRealmAuthority = async (
    connection: Connection,
    governanceProgramId: PublicKey,
    ownerKeypair: Keypair,
    realmPublicKey: PublicKey,
    communityMintGovernancePublicKey: PublicKey
) => {

    const instructions: TransactionInstruction[] = []

    withSetRealmAuthority(
        instructions,
        governanceProgramId,
        2,
        realmPublicKey,
        ownerKeypair.publicKey,
        communityMintGovernancePublicKey,
        1
    )

    const tx = new Transaction();

    tx.add(...instructions);
    tx.feePayer = ownerKeypair.publicKey;

    await sendAndConfirmTransaction(connection, tx, [ownerKeypair])

}