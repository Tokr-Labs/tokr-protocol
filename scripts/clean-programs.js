const del = require('del');
const {execSync} = require("child_process");

(async () => {
    execSync("anchor clean", {stdio: "inherit"})
    await del(['programs/**/*.js', '!cli/node_modules/**/*.js']);
})();