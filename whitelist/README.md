## Building and deploying to localnet

From the root directory run the following commands:

```
$ anchor build --provider.cluster localnet --skip-lint
$ anchor deploy --provider.cluster localnet
```

## Building for npm package deployment

This will build the anchor project for deployment of the npm package

```
$ anchor build --idl <protocol_dir>/whitelist/js/src/idl/ --idl-ts <protocol_dir>/whitelist/js/src/idl     
```