import fs from "fs";

export async function getRpcUrl(): Promise<string> {

    const configFileLocation = process.env.CONFIG ?? ""

    const configFileContent = fs.readFileSync(configFileLocation);
    const config = configFileContent.toString();

    let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")![1]

    return rpcUrl

}