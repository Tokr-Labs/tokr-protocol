const replace = require("replace-in-file");

(async () => {

    const ANCHOR_VERSION = "0.24.2";
    const SPL_TOKEN_VERSION = "0.24.2";
    const WEB3_VERSION = "1.43.1";

    const files = [
        "./package.json",
        "./cli/package.json",
        "./programs/**/client/package.json"
    ]

    const anchorDependencyOptions = {
        files: files,
        from: /"@project-serum\/anchor":\s+".+"/g,
        to: `"@project-serum/anchor": "${ANCHOR_VERSION}"`
    };

    const splTokenOptions = {
        files: files,
        from: /"@solana\/spl-token":\s+".+"/g,
        to: `"@solana/spl-token": "${SPL_TOKEN_VERSION}"`
    };

    const web3Options = {
        files: files,
        from: /"@solana\/web3\.js":\s+".+"/g,
        to: `"@solana/web3.js": "${WEB3_VERSION}"`
    };

    try {

        let anchorReplaceResults = await replace(anchorDependencyOptions)
        let splTokenResults = await replace(splTokenOptions)
        let web3Results = await replace(web3Options)

        console.log("anchorReplaceResults:")
        console.log(anchorReplaceResults)

        console.log("splTokenResults:")
        console.log(splTokenResults)

        console.log("web3Results:")
        console.log(web3Results)

    } catch (error) {

        console.error('Error occurred:', error);

    }

})();
