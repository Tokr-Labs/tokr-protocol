const {copyFileSync} = require("fs");

(async () => {

    try {

        copyFileSync(
            "target/types/identity_verification.ts",
            "identity-verification/js/src/identity_verification.ts"
        );

    } catch (error) {

        console.log(error);

    }

})()