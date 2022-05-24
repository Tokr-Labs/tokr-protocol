# Tokr Command Line Interface

This directory holds the Tokr Command Line Interface (CLI) for interacting with the on-chain and off-chain programs. Adding `-h` to any command will give you more information about the command. Simply run:

```
$ tokr -h

Usage: tokr [options] [command]

CLI to manage the tokr protocol programs.

Options:
  -V, --version              output the version number
  -h, --help                 display help for command

Commands:
  cap-table|cap              CLI for generating and interacting with spl-token cap tables.
  governance|gov             Utility CLI for creating and interacting with on-chain DAO governances.
  identity-verification|idv  Utility functions for CRUD operations for on-chain identity verification records.
  permissioned-list|perm     Utility functions for CRUD operations for on-chain permissioned lists.
  help [command]             display help for command
```

For example to generate a cap-table for a given spl token you could run:

```
$ tokr cap generate \
--mint 81jNGpGWcU6jkgDMjvZENJeYakR481q7tBkupiytPdMm \
--treasury-stock-account 2gayTFnDUkZbXTnWa9PzvRPtQFp1KYwKUssVfLy2FmrJ

{
  reservedSupply: 1000,
  authorizedSupply: 1000,
  outstandingSupply: 0,
  entries: [
    {
      holder: 'ANDKyhwCrWMagosngR44NuhGwHEtGD8r2ML3u4VkD14L',
      tokensHeld: 1000,
      percentHeld: 100
    }
  ]
}
```

Defaults for options are shown after the `<input-type>`, so if not passed the value shown will be used. And if a required option is not passed the terminal will output a helper error on what was not passed (or passed incorrectly).

```
$ tokr cap generate --mint 81jNGpGWcU6jkgDMjvZENJeYakR481q7tBkupiytPdMm

error: option '-t, --treasury-stock-account <public-key>' argument missing
```
