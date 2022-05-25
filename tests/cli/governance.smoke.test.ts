import {execSync} from "child_process";

describe("tokr cli gov smoke tests", () => {


    test.skip("create dao", () => {

        // execSync("npm run build && npm link", {cwd: "./cli", stdio: "inherit"})
        execSync("tokr gov create -i ~/dao-config.json", {stdio: "inherit"})

    })

    test.skip("deposit capital", () => {

        execSync("tokr gov deposit -i ~/deposit-capital-config.json", {stdio: "inherit"})

    })

})