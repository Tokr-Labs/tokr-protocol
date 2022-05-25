const del = require("del");
const {execSync} = require("child_process");
const path = require("path");
const fs = require("fs");
(async () => {

    execSync("node ./scripts/clean-cli.js", {stdio: "inherit"})
    execSync("node ./scripts/post-install.js", {stdio: "inherit"})

})();