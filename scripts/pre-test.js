const {execSync} = require("child_process");

execSync(`solana config set --url localhost`, {stdio: "inherit"})