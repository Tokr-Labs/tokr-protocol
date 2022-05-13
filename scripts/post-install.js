const execSync = require("child_process").execSync;

(async() => {

    // install governance cli npm packages
    execSync('npm install', { cwd: "governance/cli", stdio: "inherit" })

    // install governance js npm packages
    execSync('npm install', { cwd: "governance/js", stdio: "inherit" })

    // install identity-verification packages
    execSync('npm install', { cwd: "identity-verification", stdio: "inherit" })

    // install identity-verification cli packages
    execSync('npm install', { cwd: "identity-verification/cli", stdio: "inherit" })

    // install cap-table js npm packages
    execSync('npm install', { cwd: "cap-table/js", stdio: "inherit" })

    // install cap-table cli packages
    execSync('npm install', { cwd: "cap-table/cli", stdio: "inherit" })

    // install permissioned list cli packages
    execSync('npm install', { cwd: "permissioned-list/cli", stdio: "inherit" })

    // link governance cli
    execSync('npm run build && npm link', { cwd: "governance/cli", stdio: "inherit" })

    // link identity-verification cli
    execSync('npm run build && npm link', { cwd: "identity-verification/cli", stdio: "inherit" })

    // link permissioned-list cli
    execSync('npm run build && npm link', { cwd: "permissioned-list/cli", stdio: "inherit" })

    // link cap-table cli
    execSync('npm run build && npm link', { cwd: "cap-table/cli", stdio: "inherit" })

})();

