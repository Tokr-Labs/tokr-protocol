import {Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction} from "@solana/web3.js";
import {GovernanceConfig, MintMaxVoteWeightSource} from "./accounts";
import {withCreateRealm} from "./withCreateRealm";
import {withCreateGovernance} from "./withCreateGovernance";
import {withCreateMintGovernance} from "./withCreateMintGovernance";
import {withSetRealmAuthority} from "./withSetRealmAuthority";
import {withDepositGoverningTokens} from "./withDepositGoverningTokens";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID, AuthorityType,
    createAssociatedTokenAccountInstruction,
    createInitializeMintInstruction, createMintToInstruction, createSetAuthorityInstruction,
    getAssociatedTokenAddress,
    MintLayout,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import BN from "bn.js";

export interface WithCreateInvestmentDaoResponse {
    realm: PublicKey,
    limitedPartnerGovernance: PublicKey,
    delegateMintGovernance: PublicKey,
    distributionMintGovernance: PublicKey,
    capitalSupplyTreasury: PublicKey,
    treasuryStockTreasury: PublicKey,
    distributionTreasury: PublicKey
}

export async function withCreateInvestmentDao(
    connection: Connection,
    owner: PublicKey,
    delegate: PublicKey,
    instructionSets: TransactionInstruction[][],
    delegateMint: PublicKey,
    usdcMint: PublicKey,
    distributionMint: PublicKey,
    lpMint: PublicKey,
    governanceProgramId: PublicKey,
    realmConfig: GovernanceConfig,
    name: string,
    lpTokenSupply: number
): Promise<WithCreateInvestmentDaoResponse> {

    const mintInstructions: TransactionInstruction[] = [];
    const delegateInstructions: TransactionInstruction[] = [];
    const realmInstructions: TransactionInstruction[] = [];
    const treasuryInstructions: TransactionInstruction[] = [];

    instructionSets.push(
        mintInstructions,
        delegateInstructions,
        realmInstructions,
        treasuryInstructions
    )

    // ============================================================
    // === Mint Instructions ======================================
    // ============================================================

    const mintRentExempt = await connection.getMinimumBalanceForRentExemption(
        MintLayout.span
    )

    // create lp token account for mint

    mintInstructions.push(
        SystemProgram.createAccount({
            fromPubkey: owner,
            newAccountPubkey: lpMint,
            lamports: mintRentExempt,
            space: MintLayout.span,
            programId: TOKEN_PROGRAM_ID
        })
    )

    // create lp mint

    mintInstructions.push(
        createInitializeMintInstruction(
            lpMint,
            0,
            owner,
            null
        )
    )

    // create delegate account for mint

    mintInstructions.push(
        SystemProgram.createAccount({
            fromPubkey: owner,
            newAccountPubkey: delegateMint,
            lamports: mintRentExempt,
            space: MintLayout.span,
            programId: TOKEN_PROGRAM_ID
        })
    )

    // create delegate mint

    mintInstructions.push(
        createInitializeMintInstruction(
            delegateMint,
            0,
            owner,
            null
        )
    )

    // create distribution account for mint

    mintInstructions.push(
        SystemProgram.createAccount({
            fromPubkey: owner,
            newAccountPubkey: distributionMint,
            lamports: mintRentExempt,
            space: MintLayout.span,
            programId: TOKEN_PROGRAM_ID
        })
    )

    // create distribution mint

    mintInstructions.push(
        createInitializeMintInstruction(
            distributionMint,
            0,
            owner,
            null
        )
    )

    // ============================================================
    // === Delegate Instructions ==================================
    // ============================================================

    // get the pubkey of what will be the delegates ata for the delegate mint

    const delegateAta = await getAssociatedTokenAddress(
        delegateMint,
        delegate
    )

    // create the associated token account for the delegate

    delegateInstructions.push(
        createAssociatedTokenAccountInstruction(
            owner,
            delegateAta,
            delegate,
            delegateMint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        )
    )

    // mint 1 delegate token to the delegate

    delegateInstructions.push(
        createMintToInstruction(
            delegateMint,
            delegateAta,
            owner,
            1
        )
    )

    // ============================================================
    // === Realm Instructions =====================================
    // ============================================================

    // create the realm

    const realmAddress = await withCreateRealm(
        realmInstructions,
        governanceProgramId,
        2,
        name,
        owner,
        lpMint,
        owner,
        delegateMint,
        MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION,
        new BN(LAMPORTS_PER_SOL * 1000000)
    )

    const [tokenOwnerRecordAddress] = await PublicKey.findProgramAddress(
        [
            governanceProgramId.toBuffer(),
            realmAddress.toBuffer(),
            delegate.toBuffer(),
            owner.toBuffer(),
        ],
        governanceProgramId,
    );

    // create the lp governance for the realm

    const limitedPartnerGovernancePublicKey = await withCreateGovernance(
        realmInstructions,
        governanceProgramId,
        2,
        realmAddress,
        undefined,
        realmConfig,
        tokenOwnerRecordAddress,
        owner,
        owner
    )

    // create the delegate mint governance for the realm

    const delegateMintGovernancePublicKey = await withCreateMintGovernance(
        realmInstructions,
        governanceProgramId,
        2,  // why does program 2 work and not program 1
        realmAddress,
        delegateMint,
        realmConfig,
        !!owner,
        owner,
        tokenOwnerRecordAddress,
        owner,
        owner
    )

    // create the distribution mint governance for the real

    const distributionMintGovernancePublicKey = await withCreateMintGovernance(
        realmInstructions,
        governanceProgramId,
        2,  // why does program 2 work and not program 1
        realmAddress,
        distributionMint,
        realmConfig,
        !!owner,
        owner,
        tokenOwnerRecordAddress,
        owner,
        owner
    )

    // transfer authority of the realm from the owner to the lp governance

    withSetRealmAuthority(
        realmInstructions,
        governanceProgramId,
        2,
        realmAddress,
        owner,
        limitedPartnerGovernancePublicKey,
        1
    )

    // deposit the delegate's delegate token into the realm for them

    /*
        instructions: TransactionInstruction[],
        programId: PublicKey,
        programVersion: number,
        realm: PublicKey,
        governingTokenSource: PublicKey,
        governingTokenMint: PublicKey,
        governingTokenOwner: PublicKey,
        transferAuthority: PublicKey,
        payer: PublicKey,
        amount: BN,
    */

    await withDepositGoverningTokens(
        realmInstructions,
        governanceProgramId,
        2, // why does program 2 work and not program 1
        realmAddress,
        delegateAta,
        delegateMint,
        delegate,
        delegate,
        delegate,
        new BN(1)
    )

    // ============================================================
    // === Treasury Instructions ==================================
    // ============================================================

    // get pk of what the usdc treasury for the lp governance will be

    const capitalSupplyTreasuryPubkey = await getAssociatedTokenAddress(
        usdcMint,
        limitedPartnerGovernancePublicKey,
        true,
    )

    // create the ata for the lp governance usdc mint

    treasuryInstructions.push(
        createAssociatedTokenAccountInstruction(
            owner,
            capitalSupplyTreasuryPubkey,
            limitedPartnerGovernancePublicKey,
            usdcMint
        )
    )

    // get the reference for ata of the lp token mint

    const treasuryStockTreasuryPubkey = await getAssociatedTokenAddress(
        lpMint,
        delegateMintGovernancePublicKey,
        true,
    )

    // create the ata for the lp token mint and set the owner as the authority oif the delegate governance

    treasuryInstructions.push(
        createAssociatedTokenAccountInstruction(
            owner,
            treasuryStockTreasuryPubkey,
            delegateMintGovernancePublicKey,
            lpMint
        )
    )

    // create ata for the distribution usdc mint

    const distributionTreasuryPubkey = await getAssociatedTokenAddress(
        usdcMint,
        distributionMintGovernancePublicKey,
        true,
    )

    // create the usdc treasury for usdc distributions

    treasuryInstructions.push(
        createAssociatedTokenAccountInstruction(
            owner,
            distributionTreasuryPubkey,
            distributionMintGovernancePublicKey,
            usdcMint
        )
    )

    // mint the initial supply of lp tokens to the owner

    treasuryInstructions.push(
        createMintToInstruction(
            lpMint, // mint
            treasuryStockTreasuryPubkey, // destination
            owner, // authority
            lpTokenSupply // amount
        )
    )

    // set the mint authority to null so the lp token count is fixed

    treasuryInstructions.push(
        createSetAuthorityInstruction(
            lpMint,
            owner,
            AuthorityType.MintTokens,
            null
        )
    )

    return {
        realm: realmAddress,
        limitedPartnerGovernance: limitedPartnerGovernancePublicKey,
        delegateMintGovernance: delegateMintGovernancePublicKey,
        distributionMintGovernance: distributionMintGovernancePublicKey,
        capitalSupplyTreasury: capitalSupplyTreasuryPubkey,
        treasuryStockTreasury: treasuryStockTreasuryPubkey,
        distributionTreasury: distributionTreasuryPubkey
    }

}