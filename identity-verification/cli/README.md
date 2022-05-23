# Identity Verification CLI

CLI for interacting with the on-chain identity verification program.

# Usage

Create Record:

```
tokr-idv create-record \
    -u ~/.config/solana/id.json \
    -a BATKyhwCrWMagosngR44NuhGwHEtGD8r2ML3u4VkD14L \
    -g 98VUKFoD7KqYfBNnvyJiuKmb8sj5ws7HotZopSngxsqY \
    -p 3YC2irJKAzmuqeg2Qf9v8YBb1ufGmYTuvggxqv4bCyST
```

Approve Record:

```
tokr-idv approve-record \
    -u BATKyhwCrWMagosngR44NuhGwHEtGD8r2ML3u4VkD14L \ 
    -a ~/.config/solana/id.json \
    -g 98VUKFoD7KqYfBNnvyJiuKmb8sj5ws7HotZopSngxsqY \ 
    -p 3YC2irJKAzmuqeg2Qf9v8YBb1ufGmYTuvggxqv4bCyST
```