import path from "path";
import fs from "fs";

export async function setAnchorProviderUrl() {

    const cwd = process.cwd();

    // hijack cwd so that it returns the correct location
    process.cwd = () => {
        return path.resolve(cwd, "../../")
    }

    // @ts-ignore
    const content = fs.readFileSync(process.env.CONFIG.toString());
    const config = content.toString();

    let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")![1]
    rpcUrl = rpcUrl.replace(/(")+/gi, "")

    process.env.ANCHOR_PROVIDER_URL = rpcUrl

}