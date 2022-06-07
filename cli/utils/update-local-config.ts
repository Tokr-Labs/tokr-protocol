import {exec} from "./exec";

export async function updateLocalConfig(ownerKeyPair: string, cluster: string)  {

    await exec(`
        solana config set 
        -k ${ownerKeyPair}
        -u ${cluster}
    `, {capture: true, echo: false});

}
