const {copyFileSync} = require("fs");

(async () => {

    try {

        copyFileSync(
            "target/types/identity_verification.ts",
            "programs/identity-verification/js/src/models/idl.ts"
        );

    } catch (error) {

        console.log(error);

    }

})()