const {copyFileSync} = require("fs");

(async () => {

    try {

        copyFileSync(
            "target/types/identity_verification.ts",
            "identity-verification/js/src/models/idl.ts"
        );

    } catch (error) {

        console.log(error);

    }

})()