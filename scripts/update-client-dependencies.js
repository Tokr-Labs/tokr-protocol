// reference all package.json files
// find any reference to anchor, spl-token or web3 and set their values to match
// "@project-serum/anchor": "0.24.2",
// "@solana/spl-token": "0.2.0",
// "@solana/web3.js": "1.43.1",

const replace = require("replace-in-file");
const options = {
    files: [
        "./package.json",
        "./cli/package.json",
        "./programs/**/client/package.json"
    ],
    from: /"@project-serum\/anchor":\s+".+"/g,
    to: '"@project-serum/anchor": "0.24.2"'
};

try {
    const results = await replace(options)
    console.log('Replacement results:', results);
}
catch (error) {
    console.error('Error occurred:', error);
}