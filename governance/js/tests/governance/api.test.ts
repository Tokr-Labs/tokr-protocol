import {getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount} from '@solana/spl-token';
import {Connection, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction,} from '@solana/web3.js';
import {withDepositCapital} from "../../src/governance/withDepositCaptial";
import {loadKeypair} from "../../../../utils/cli/load-keypair";


const programId = new PublicKey('5Hyx5g6n82uZpVYRLZqssLSj5V6mZc2QYQFtPcj83Jp2');
const identityVerificationProgramId = new PublicKey('3YC2irJKAzmuqeg2Qf9v8YBb1ufGmYTuvggxqv4bCyST');
const rpcEndpoint = 'http://127.0.0.1:8899';

const connection = new Connection(rpcEndpoint, {
    commitment: "recent"
});

test("test deposit capital", async () => {

    /*

    Realm: 98VUKFoD7KqYfBNnvyJiuKmb8sj5ws7HotZopSngxsqY

    LP Token Mint: HzhBrBLD8NQrE1jwHNptvmFmgQ1nddtHTamWy7eqLtTJ
    Delegate Token Mint: F2RdujrSfffnTc1Qps8bEtxW25Wm2j1u7d2Ph3ZLQKzt
    Distribution Token Mint: BcugFTYmrEQWj7UqGsfWrJodDQq3twto2gt5KHr4hP6V

    LP Governance: HApH8Zr8fqXyoH3xyjaj4PBdgWyCDPiGevu4ijTCGb9E
    LP Governed Account: CowrJkkfCsstkRMmvdstok8RAoEgo5qYDRyw19EP2RLz
    Delegate Mint Governance: UW21kChKwbPjtrYipcGqWXrKkG3XvHchKYgbLdauhCB
    Distribution Mint Governance: Eq9Zg7rYKj5b5kjp5P2feUu1Mvr5u5kLW13fNHp5vKWR

    Capital Supply Treasury: GfoMVfjKitFnPfCVN6B3k4Mdv9y2GFcpr5E3sCLSwkvg
    Treasury Stock Treasury: BKbEUJYsM3GB9z6Xxxewakqtt4jom1vBVo41ogKaH1ur
    Distribution Treasury: tYWEBspgLhDce8Y83i8eNKTLx4rVrWGGQeoxTMd3Dnq

    */

    let instructions: TransactionInstruction[] = [];

    // const ownerKeypair = await loadKeypair("~/solana-keys/spiderman.json")
    // const ownerKeypair = await loadKeypair("~/solana-keys/blackwidow.json")
    const ownerKeypair = await loadKeypair("~/.config/solana/id.json")
    // const ownerKeypair = await loadKeypair("~/solana-keys/moonknight.json")
    // const ownerKeypair = await loadKeypair("~/solana-keys/drstrange.json")
    // const ownerKeypair = await loadKeypair("~/solana-keys/hulk.json")
    // const ownerKeypair = await loadKeypair("~/solana-keys/quicksilver.json")
    // const ownerKeypair = await loadKeypair("~/solana-keys/beast.json")

    const realmPublicKey = new PublicKey("98VUKFoD7KqYfBNnvyJiuKmb8sj5ws7HotZopSngxsqY")
    const usdcMintPublicKey = new PublicKey("Ha46W7m15Pviwwv95AnjXThFxum3nhcjEdvSw9GxxTWA")
    const capitalGovernancePublicKey = new PublicKey("HApH8Zr8fqXyoH3xyjaj4PBdgWyCDPiGevu4ijTCGb9E"); // lp governance
    const lpMintPublicKey = new PublicKey("HzhBrBLD8NQrE1jwHNptvmFmgQ1nddtHTamWy7eqLtTJ");
    const lpGovernancePublicKey = new PublicKey("UW21kChKwbPjtrYipcGqWXrKkG3XvHchKYgbLdauhCB"); // delegate mint governance
    const delegateTokenMint = new PublicKey("F2RdujrSfffnTc1Qps8bEtxW25Wm2j1u7d2Ph3ZLQKzt");

    const usdcTokenSource = await getOrCreateAssociatedTokenAccount(
        connection,
        ownerKeypair,
        usdcMintPublicKey,
        ownerKeypair.publicKey
    )

    const lpTokenAccount = await getAssociatedTokenAddress(lpMintPublicKey, ownerKeypair.publicKey)

    await withDepositCapital(
        instructions,
        programId,
        identityVerificationProgramId,
        realmPublicKey,
        capitalGovernancePublicKey,
        lpGovernancePublicKey,
        ownerKeypair.publicKey,
        usdcTokenSource.address,
        usdcMintPublicKey,
        lpTokenAccount,
        lpMintPublicKey,
        delegateTokenMint,
        1
    )

    const tx = new Transaction()
    tx.add(...instructions);

    const sig = await sendAndConfirmTransaction(
        connection,
        tx,
        [ownerKeypair],
        {
            skipPreflight: true
        }
    )

    expect(sig).toBeDefined()

});
