const execSync = require("child_process").execSync;

(async () => {

    // install governance js npm packages and build its library
    execSync('npm install', {cwd: "programs/governance/js", stdio: "inherit"})
    execSync('npm run build', {cwd: "programs/governance/js", stdio: "inherit"})

    // install identity-verification packages and build its library
    execSync('npm install', {cwd: "programs/identity-verification/js", stdio: "inherit"})
    execSync('npm run build', {cwd: "programs/identity-verification/js", stdio: "inherit"})

    // install cap-table js npm packages and build its library
    execSync('npm install', {cwd: "programs/cap-table/js", stdio: "inherit"})
    execSync('npm run build', {cwd: "programs/cap-table/js", stdio: "inherit"})

    // run install for the cli
    execSync('npm install', {cwd: "cli", stdio: "inherit"})

    // build the root directory in order to build programs and create program idls
    execSync('npm run build', {stdio: "inherit"})

    // build and link the cli for use locally
    execSync('npm run build && npm link', {cwd: "cli", stdio: "inherit"})

})();

