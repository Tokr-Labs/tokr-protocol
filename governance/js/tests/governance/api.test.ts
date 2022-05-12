import {getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount} from '@solana/spl-token';
import {
    Connection,
    Keypair,
    PublicKey,
    sendAndConfirmTransaction,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import {withDepositCapital} from "../../src/governance/withDepositCaptial";
import path from "path";
import process from "process";
import fs from "fs";

// const programId = new PublicKey('GTesTBiEWE32WHXXE2S4XbZvA5CrEc4xs6ZgRe895dP');
// const rpcEndpoint = clusterApiUrl('devnet');

const programId = new PublicKey('DiXa9VmFGhJYco4b83ACWpCo95prArWdNsBPvGwfGLgV');
const rpcEndpoint = 'http://127.0.0.1:8899';

const connection = new Connection(rpcEndpoint, {
    commitment: "recent"
});

test("test deposit capital", async () => {

    /*
    Realm: EkwKC1vSdazzuab2QbkprqwVezM4i6Q49CfFLKA6Krc5

    LP Token Mint: 5gnm1PP6BG1HtTbnBMwaakLbowdJ9hG8PkZEGM3wDQBA
    Delegate Token Mint: 9zpBdhhNjtDP9LCpJcG84Kbts1K2rzMmRFc6DRWyPCRq
    Distribution Token Mint: AHTxrRddhRhDvCAcu5ASZs8hHtTqKLci7B4bcaV1qjrB

    LP Governance: EJeFL6kwsEfvnJwLQ68rcU85HhkmJ5986MeLZG9BcEUn
    LP Governed Account: J3qkekEFiPpYcQhG9FqSMUYHfG3AVZd7puBfvNX1Lmkm
    Delegate Mint Governance: 4SfqXCa2gLqvNzDZVWVDg8LvxfFQzTMCX7VkCFnJgq3y
    Distribution Mint Governance: HJfvvL2VSWMhuPdc4ukzELBA1QjqdvAvtTtguMaxAXrZ

    Capital Supply Treasury: 9Rm9JdDE3tiSSTw6PZxLmhwtBPVNRUPdGJQfyDCWBHnC
    Treasury Stock Treasury: 8uaDG6tUgQUHA4qDDZxancmLN2H7FpqrcN8ND1UAU9Pp
    Distribution Treasury: HjkVKFmjWnGvppc8sHuArQgPU2oqZcpgecveSezNH7A7

    */

    let instructions: TransactionInstruction[] = [];

    // const ownerKeypair = await loadKeypair("~/solana-keys/spiderman.json")
    // const ownerKeypair = await loadKeypair("~/solana-keys/blackwidow.json")
    // const ownerKeypair = await loadKeypair("~/.config/solana/id.json")
    // const ownerKeypair = await loadKeypair("~/solana-keys/moonknight.json")
    // const ownerKeypair = await loadKeypair("~/solana-keys/drstrange.json")
    // const ownerKeypair = await loadKeypair("~/solana-keys/hulk.json")
    const ownerKeypair = await loadKeypair("~/solana-keys/quicksilver.json")

    const realmPublicKey = new PublicKey("EkwKC1vSdazzuab2QbkprqwVezM4i6Q49CfFLKA6Krc5")
    const usdcMintPublicKey = new PublicKey("GLgjt8zEJwuYAKg9tLy9ZTCC9k7VUf46yfx7EQuDXdzf")
    const capitalGovernancePublicKey = new PublicKey("EJeFL6kwsEfvnJwLQ68rcU85HhkmJ5986MeLZG9BcEUn"); // lp governance
    const lpMintPublicKey = new PublicKey("5gnm1PP6BG1HtTbnBMwaakLbowdJ9hG8PkZEGM3wDQBA");
    const lpGovernancePublicKey = new PublicKey("4SfqXCa2gLqvNzDZVWVDg8LvxfFQzTMCX7VkCFnJgq3y"); // delegate mint governance
    const delegateTokenMint = new PublicKey("9zpBdhhNjtDP9LCpJcG84Kbts1K2rzMmRFc6DRWyPCRq");

    const usdcTokenSource = await getOrCreateAssociatedTokenAccount(
        connection,
        ownerKeypair,
        usdcMintPublicKey,
        ownerKeypair.publicKey
    )

    const lpTokenAccount = await getAssociatedTokenAddress(lpMintPublicKey,ownerKeypair.publicKey)

    await withDepositCapital(
        instructions,
        programId,
        realmPublicKey,
        capitalGovernancePublicKey,
        lpGovernancePublicKey,
        ownerKeypair.publicKey,
        usdcTokenSource.address,
        usdcMintPublicKey,
        lpTokenAccount,
        lpMintPublicKey,
        delegateTokenMint,
        5000
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


async function loadKeypair(fileRef: string) {

    let filePath = fileRef;

    if (filePath[0] === '~') {
        filePath = path.join(process.env.HOME!, filePath.slice(1));
    }

    let contents = fs.readFileSync(`${filePath}`);

    let parsed = String(contents)
        .replace("[", "")
        .replace("]", "")
        .split(",")
        .map((item) => Number(item))

    const uint8Array = Uint8Array.from(parsed);

    return Keypair.fromSecretKey(uint8Array);

}