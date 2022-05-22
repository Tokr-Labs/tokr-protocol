const execSync = require("child_process").execSync;

(async () => {

    // install governance js npm packages
    execSync('npm install', {cwd: "programs/governance/js", stdio: "inherit"})

    // install identity-verification packages
    execSync('npm install', {cwd: "programs/identity-verification/js", stdio: "inherit"})

    // install cap-table js npm packages
    execSync('npm install', {cwd: "programs/cap-table/js", stdio: "inherit"})

    // link governance cli
    execSync('npm install', {cwd: "cli", stdio: "inherit"})
    execSync('anchor build', {stdio: "inherit"})
    execSync('npm run build && npm link', {cwd: "cli", stdio: "inherit"})

})();

