const del = require('del');
const {execSync} = require("child_process");
const fs = require("fs");
const path = require("path");

(async () => {

    await del(['cli/**/*.js', '!cli/node_modules/**/*.js']);

    const location = execSync("which node");
    const nodeLocation = location.toString().trim()
    const binDir = path.dirname(nodeLocation);
    const tokrCli = path.join(binDir, "tokr")
    const isTokrCliInstalled = fs.existsSync(tokrCli)

    if (isTokrCliInstalled) {
        await del([tokrCli],{force: true});
    }

})();