const execSync = require("child_process").execSync;

(async() => {

    // link governance cli
    execSync('npm run build && npm link', { cwd: "governance/cli", stdio: "inherit" })

    // link identity-verification cli
    execSync('npm link', { cwd: "identity-verification/cli", stdio: "inherit" })

})();
