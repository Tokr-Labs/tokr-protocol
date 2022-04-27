# Tokr Protocol

A collection of on-chain programs that work together to support governance over Tokr's DeFi products.

## Setup

Running npm install will install all packages throughout the repo. It will also setup the CLIs for governance and identity verification.

```
$ npm install
```

## Build

```
$ anchor build
```

## Deploy

```
$ anchor deploy [--provider.cluster localnet|devnet|mainnet]
```

## Upgrade

```
$ solana address -k target/deploy/[PROGRAME_NAME]-keypair.json
$ anchor upgrade [--provider.cluster localnet|devnet|mainnet] --program-id [PROGRAM_ID] target/deploy/[PROGRAM_NAME].so
```