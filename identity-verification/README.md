## Building and deploying to a cluster

From the root directory run the following commands:

```
$ anchor build --provider.cluster localnet --skip-lint
$ anchor deploy --provider.cluster localnet
```

## Building for npm package deployment

This will build the anchor project for deployment of the npm package. You should run this from the root directory:

```
$ anchor build --idl <protocol_dir>/identity_verification/js/src/idl/ --idl-ts <protocol_dir>/identity_verification/js/src/idl     
```

**NOTE** - It seems that you have to provide an absolute file path for the above. relative file paths fail and create directories instead of the actual files.