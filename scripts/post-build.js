const {copyFileSync} = require("fs");

(async () => {

    try {

        copyFileSync(
            "target/types/identity_verification.ts",
            "programs/identity-verification/client/src/models/idl.ts"
        );

    } catch (error) {

        console.log(error);

    }

})()