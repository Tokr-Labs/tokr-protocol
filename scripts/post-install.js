const execSync = require("child_process").execSync;

(async () => {

    // install programs client packages
    execSync('npm install', {cwd: "programs/governance/client", stdio: "inherit"})
    execSync('npm install', {cwd: "programs/identity-verification/client", stdio: "inherit"})
    execSync('npm install', {cwd: "programs/cap-table/client", stdio: "inherit"})

    // run install for the cli
    execSync('npm install', {cwd: "cli", stdio: "inherit"})

    // build the root directory in order to build programs and create program idls
    execSync('npm run build', {stdio: "inherit"})

    // build and link the cli for use locally
    execSync('npm run build && npm link', {cwd: "cli", stdio: "inherit"})

})();

