import fs from "fs";

export async function getCluster(): Promise<"mainnet" | "devnet" | "localnet"> {

    const configFileLocation = process.env.CONFIG ?? ""

    const configFileContent = fs.readFileSync(configFileLocation);
    const config = configFileContent.toString();

    let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")![1]

    if (rpcUrl.match(/main/)) {
        return "mainnet"
    } else if (rpcUrl.match(/dev/)) {
        return "devnet"
    } else {
        return "localnet"
    }

}