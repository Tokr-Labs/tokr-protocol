# Tokr Protocol

A collection of on-chain programs that work together to support governance over Tokr's DeFi products.

## Setup

Running npm install will install all packages throughout the repo. It will also setup the CLIs for governance and identity verification.

```
$ npm install
```

## Building Programs

Running the following command will build all programs referenced in the `Anchor.toml` file in the root directory.

```
$ anchor build
```

## Deploying Programs

Deploying programs is a bit tricky right now for Anchor programs. Everytime the target directory is deleted or someone new joins the team the locally built programs will have different IDs. WIP to write scripts that make this much easier and there is a new PR to anchor for adding the ability to pass a keypair rather than using the generated ones. These instructions will likely change as soon as that functionality is available through the Anchor CLI.

**IMPORTANT** Deploying to different environments you will need to update the program id in `lib.rs` by replacing the base58 key declared at the top of the file with the correct id for the environment being deployed to. After updating this variable you will need to run `anchor build` before deploying.

### Deploy to devnet
```
$ anchor deploy
```

### Deploy to devnet or mainnet

Deployment should only have to happen once, unless there is a reason to create a new version of the program and keep the old one running. 
**CAUTION** These steps are very important for the first deployment:

1. Run anchor build
2. Replace the contents of `target/deploy/identity_verification-keypair.json` with the contents of our production version of the keypair `idv2F375xYuz2K7a7LxcrkhgWbPsJgpuWD3XLW1AFdD.json` or `CCzEwDHqNqq4KL4srnRKQeQ7P9Aa1uoAQmkz1kWFc2rd.json` for mainnet and devnet respectively.
3. Replace the contents of `target/deploy/spl_governance-keypair.json` with the contents of our production version of the keypair `govB89Q9nod6CYMjC2zVhefv4oW1zWrYQGfU7gAsrnr.json` or `5WJNeGKQQJMaTCPgtXhmsiEK4bA6dLT94smLFmTU8Gh9.json` for mainnet and devnet respectively.

```
$ anchor build
$ anchor deploy --provider.cluster [mainnet | devnet]
```

## Upgrading Programs

**IMPORTANT** Upgrading programs on different environments you will need to update the program id in `lib.rs` by replacing the base58 key declared at the top of the file with the correct id for the environment being deployed to. After updating this variable you will need to run `anchor build` before upgrading.

### Mainnet and devnet

Once the programs are initially deployed we'll want to keep the same program ids so we'll need to make sure we only run upgrade in this scenario.

**Devnet**

```
$ anchor upgrade --provider.cluster devnet --program-id CCzEwDHqNqq4KL4srnRKQeQ7P9Aa1uoAQmkz1kWFc2rd ./target/deploy/spl_governance.so
$ anchor upgrade --provider.cluster devnet --program-id 5WJNeGKQQJMaTCPgtXhmsiEK4bA6dLT94smLFmTU8Gh9 ./target/deploy/identity_verification.so
```

**Mainnet**

```
$ anchor upgrade --provider.cluster mainnet --program-id govB89Q9nod6CYMjC2zVhefv4oW1zWrYQGfU7gAsrnr ./target/deploy/spl_governance.so
$ anchor upgrade --provider.cluster mainnet --program-id idv2F375xYuz2K7a7LxcrkhgWbPsJgpuWD3XLW1AFdD ./target/deploy/identity_verification.so
```

## Running the programs locally

1. Solana tool-chain
   - You can refer to this [article](https://docs.solana.com/cli/install-solana-cli-tools) for help with that.
   - If you have trouble setting up your local environment and running the test validator see this [repo](https://github.com/TOKR-labs/sol-playground) for help.
2. [Tokr CLI](https://github.com/TOKR-labs/tokr-cli)
   
The following steps will get your machine up and running with the tokr programs.

Here we're making sure that our local config is pointing to http://localhost:8899 where our cluster is running.

```
$ solana config set --url localhost
```

This starts the localnet cluster of solana. Running with `--reset` will basically bring you back to the genesis hash, like a system reset of sorts.

```
$ solana-test-validator [--reset]
```

Open a new terminal window and run the following command. It will esentially set up a tail for the logs which are useful during development.

```
$ solana logs
```

We'll need to create a mint/token for what we'll call USDC in localnet (and devnet). This is because USDC does not exist in our cluster as it does on mainnet. Make not of the Mint Address, we'll need this for a later step.

```
$ tokr create-spl-token --amount 1000000
```

This will build out programs (governance and identity verification)

```
$ anchor build
```

Next we'll deploy these programs out to devnet. Make not of the program IDs as we'll need those later.

```
$ anchor deploy [--provider.cluster localnet]
```

## Creating a DAO on localnet

You'll need to airdrop funds to whoever you are wanting to make the delegate of the DAO, These will be used for fees, but it also tells localnet that this is a real user account owned by the system program and not a PDA.

```
$ solana airdrop 10 [DELEGATE_PUBLIC_KEY]
```

Copy and paste the `example-config.json` file in the `/governance/cli` directory rename it and place it somewhere on you machine outside of the repo. 
This config file is what we use to determine how to set up the DAO. The file contents look like this. 

```
{
  "cluster": "http://localhost:8899",
  "owner": "~/.config/solana/id.json",
  "delegate": "~/.config/solana/id.json",
  "name": "Realm 2",
  "governanceProgramId": "7cjMfQWdJ9Va2pjSZM3D9G2PGCwgWMzbgcaVymCtRVQZ",
  "usdcMint": "4vLoappqntEvnxT1uSATbjt1nPMG2q6HjhHVgyuxxAaW",
  "governance": {
    "voteThresholdPercentage": 100,
    "minCommunityTokensToCreateProposal": 10000000,
    "minInstructionHoldUpTime": 0,
    "maxVotingTime": 259250,
    "voteTipping": 0,
    "proposalCoolOffTime": 0,
    "minCouncilTokensToCreateProposal": 1
  }
}
```

You will need to replace the values of the governance program id to your localnet program id as well as whatever the USDC token mint was from above instructions.

```
$ tokr-governance \
    create-dao \
    -i ~/Desktop/config.json
```