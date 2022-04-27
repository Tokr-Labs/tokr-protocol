const fs = require("fs");
const anchor = require("@project-serum/anchor");
const spawn = require("child_process").spawn;

async function loadKeypair(fileRef) {

    let contents = await fs.readFileSync(fileRef);

    let parsed = String(contents)
        .replace("[", "")
        .replace("]", "")
        .split(",")
        .map((item) => Number(item))

    const uint8Array = Uint8Array.from(parsed);

    return anchor.web3.Keypair.fromSecretKey(uint8Array);

}

module.exports.loadKeypair = loadKeypair;