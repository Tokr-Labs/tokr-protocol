#!/usr/bin/env node

import {Command} from "commander";
import capTableCommands from "./cap-table";
import governanceCommands from "./governance";
import identityVerificationCommands from "./identity-verification";
import permissionedListCommands from "./permissioned-list";

(async function main() {

    const program = new Command();

    program
        .name("tokr")
        .description("CLI to manage the tokr protocol programs.")
        .version("0.1.0");

    await capTableCommands(program);
    await governanceCommands(program);
    await identityVerificationCommands(program);
    await permissionedListCommands(program);

    await program.parseAsync();

})();