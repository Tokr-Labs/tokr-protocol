# tokr-protocol

## Setup

```
$ npm install

```

## Building the Protocol Programs

```
$ anchor build
```

## Deploying the Protocol Programs

```
$ anchor deploy [--provider.cluster localnet|devnet|mainnet]
```

## Upgrading an Individual Program

```
$ solana address -k target/deploy/[PROGRAME_NAME]-keypair.json
$ anchor upgrade [--provider.cluster localnet|devnet|mainnet] --program-id [PROGRAM_ID] target/deploy/[PROGRAM_NAME].so
```