const assert = require("assert");
const anchor = require("@project-serum/anchor");
const { SystemProgram } = anchor.web3;

describe("whitelist", () => {

  // Use a local provider.
  const provider = anchor.AnchorProvider.local();

  console.log(provider);

  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  it("Creates and initializes an account in a single atomic transaction (simplified)", async () => {

    // #region code-simplified
    // The program to execute.
    const program = anchor.workspace.Whitelist;

    console.log(anchor.workspace);

    // The Account to create.
    const myAccount = anchor.web3.Keypair.generate();

    // Create the new account and initialize it with the program.
    // #region code-simplified
    await program.rpc.initialize(new anchor.BN(1234), {
      accounts: {
        myAccount: myAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [myAccount],
    });
    // #endregion code-simplified

    // Fetch the newly created account from the cluster.
    const account = await program.account.myAccount.fetch(myAccount.publicKey);

    // Check it's state was initialized.
    assert.ok(account.data.eq(new anchor.BN(1234)));

    // Store the account for the next test.
    _myAccount = myAccount;
  });

  it("Updates a previously created account", async () => {
    const myAccount = _myAccount;

    // #region update-test

    // The program to execute.
    const program = anchor.workspace.Whitelist;

    // Invoke the update rpc.
    await program.rpc.update(new anchor.BN(4321), {
      accounts: {
        myAccount: myAccount.publicKey,
      },
    });

    // Fetch the newly updated account.
    const account = await program.account.myAccount.fetch(myAccount.publicKey);

    // Check it's state was mutated.
    assert.ok(account.data.eq(new anchor.BN(4321)));

    // #endregion update-test
  });

});
