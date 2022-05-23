"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDao = void 0;
const child_process_1 = require("child_process");
const bn_js_1 = __importDefault(require("bn.js"));
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const accounts_1 = require("../../js/src/governance/accounts");
const withDepositGoverningTokens_1 = require("../../js/src/governance/withDepositGoverningTokens");
const withCreateMintGovernance_1 = require("../../js/src/governance/withCreateMintGovernance");
const withSetRealmAuthority_1 = require("../../js/src/governance/withSetRealmAuthority");
const withCreateGovernance_1 = require("../../js/src/governance/withCreateGovernance");
const withCreateRealm_1 = require("../../js/src/governance/withCreateRealm");
const fs = __importStar(require("fs"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const underscore_1 = require("underscore");
const process = __importStar(require("process"));
const createDao = (configFile) => __awaiter(void 0, void 0, void 0, function* () {
    const configStr = (0, fs_1.readFileSync)(configFile, { encoding: "utf8" });
    const config = JSON.parse(configStr);
    if (!validateConfig(config)) {
        console.error("Invalid JSON format detected.");
        process.exit(1);
    }
    const cluster = config.cluster;
    const owner = config.owner;
    const delegate = config.delegate;
    const name = config.name;
    const governanceProgramId = config.governanceProgramId;
    const usdcMint = config.usdcMint;
    const maxLpTokenSupply = config.maxLpTokenSupply;
    const governanceConfig = config.governance;
    console.log();
    console.log("Input:");
    console.log();
    console.log(config);
    console.log();
    console.log("Updating local solana configuration...");
    console.log();
    yield updateLocalConfig(owner, cluster);
    const connection = new web3_js_1.Connection(cluster, {
        commitment: "confirmed"
    });
    const ownerKeypair = yield loadKeypair(owner);
    const delegateKeypair = yield loadKeypair(delegate);
    const governanceProgramIdPublicKey = new web3_js_1.PublicKey(governanceProgramId);
    const usdcMintPublicKey = new web3_js_1.PublicKey(usdcMint);
    const limitedPartnerMintKeypair = web3_js_1.Keypair.generate();
    const delegateMintKeypair = web3_js_1.Keypair.generate();
    const distributionMintKeypair = web3_js_1.Keypair.generate();
    let mintInstructions = [];
    console.log("Creating mint instructions for LP Token...");
    yield createMintInstructions(mintInstructions, connection, limitedPartnerMintKeypair, ownerKeypair, 0);
    console.log("Creating mint instructions for Delegate Token...");
    yield createMintInstructions(mintInstructions, connection, delegateMintKeypair, ownerKeypair, 0);
    console.log("Creating mint instructions for Distribution Token...");
    yield createMintInstructions(mintInstructions, connection, distributionMintKeypair, ownerKeypair, 0);
    console.log("Executing mint instructions...");
    yield executeMintInstructions(connection, mintInstructions, [
        limitedPartnerMintKeypair,
        delegateMintKeypair,
        distributionMintKeypair
    ], ownerKeypair);
    console.log("Minting 1 Delegate Token to delegate...");
    yield mintDelegateTokenForDelegate(connection, ownerKeypair, delegateMintKeypair.publicKey, delegateKeypair);
    console.log("Minting max supply of LP tokens...");
    const ownerAta = yield mintMaxLpTokens(connection, ownerKeypair, limitedPartnerMintKeypair.publicKey, ownerKeypair.publicKey, maxLpTokenSupply);
    console.log("Disabling LP token mint authority...");
    yield (0, spl_token_1.setAuthority)(connection, ownerKeypair, limitedPartnerMintKeypair.publicKey, ownerKeypair, spl_token_1.AuthorityType.MintTokens, null);
    console.log("Creating realm...");
    const realmPublicKey = yield createRealm(connection, governanceProgramIdPublicKey, ownerKeypair, delegateMintKeypair.publicKey, limitedPartnerMintKeypair.publicKey, name);
    console.log("Depositing delegate's Delegate Token to realm...");
    yield depositDelegateCouncilTokenInGovernance(connection, governanceProgramIdPublicKey, delegateKeypair, ownerKeypair, realmPublicKey, delegateMintKeypair.publicKey);
    console.log("Creating governances...");
    let { limitedPartnerGovernedAccountPublicKey, limitedPartnerGovernancePublicKey, delegateMintGovernancePublicKey, distributionMintGovernancePublicKey } = yield createGovernances(connection, governanceProgramIdPublicKey, governanceConfig, ownerKeypair, realmPublicKey, delegateMintKeypair.publicKey, limitedPartnerMintKeypair.publicKey, distributionMintKeypair.publicKey);
    console.log("Setting LP governance as realm authority...");
    yield setLimitedPartnerGovernanceAsRealmAuthority(connection, governanceProgramIdPublicKey, ownerKeypair, realmPublicKey, limitedPartnerGovernancePublicKey);
    console.log("Creating Capital Supply (USDC) treasury account under LP governance...");
    const capitalSupplyTreasuryPubkey = yield createTreasuryAccount(connection, ownerKeypair, usdcMintPublicKey, limitedPartnerGovernancePublicKey);
    console.log("Creating Treasury Stock (LP Token) treasury account under Delegate Governance...");
    const treasuryStockTreasuryPubkey = yield createTreasuryAccount(connection, ownerKeypair, limitedPartnerMintKeypair.publicKey, delegateMintGovernancePublicKey);
    console.log("Creating Distribution (USDC) treasury account under Distribution governance...");
    const distributionTreasuryPubkey = yield createTreasuryAccount(connection, ownerKeypair, usdcMintPublicKey, distributionMintGovernancePublicKey);
    console.log("Transferring LP tokens to Treasury Stock account...");
    yield (0, spl_token_1.transfer)(connection, ownerKeypair, ownerAta, treasuryStockTreasuryPubkey, ownerKeypair, maxLpTokenSupply);
    console.log();
    console.log();
    console.log("OUTPUT:");
    console.log();
    console.log(`Realm: ${realmPublicKey}`);
    console.log();
    console.log(`LP Token Mint: ${limitedPartnerMintKeypair.publicKey.toBase58()}`);
    console.log(`Delegate Token Mint: ${delegateMintKeypair.publicKey.toBase58()}`);
    console.log(`Distribution Token Mint: ${distributionMintKeypair.publicKey.toBase58()}`);
    console.log();
    console.log(`LP Governance: ${limitedPartnerGovernancePublicKey}`);
    console.log(`LP Governed Account: ${limitedPartnerGovernedAccountPublicKey}`);
    console.log(`Delegate Mint Governance: ${delegateMintGovernancePublicKey}`);
    console.log(`Distribution Mint Governance: ${distributionMintGovernancePublicKey}`);
    console.log();
    console.log(`Capital Supply Treasury: ${capitalSupplyTreasuryPubkey}`);
    console.log(`Treasury Stock Treasury: ${treasuryStockTreasuryPubkey}`);
    console.log(`Distribution Treasury: ${distributionTreasuryPubkey}`);
    console.log();
    console.log("Complete.");
});
exports.createDao = createDao;
const updateLocalConfig = (ownerKeyPair, cluster) => __awaiter(void 0, void 0, void 0, function* () {
    yield exec(`
        solana config set 
        -k ${ownerKeyPair}
        -u ${cluster}
    `, { capture: true, echo: false });
});
const createMintInstructions = (instructions, connection, mintKeypair, ownerKeypair, decimals) => __awaiter(void 0, void 0, void 0, function* () {
    const mintRentExempt = yield connection.getMinimumBalanceForRentExemption(spl_token_1.MintLayout.span);
    const createAccountTransactionInstruction = web3_js_1.SystemProgram.createAccount({
        fromPubkey: ownerKeypair.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        lamports: mintRentExempt,
        space: spl_token_1.MintLayout.span,
        programId: spl_token_1.TOKEN_PROGRAM_ID
    });
    const createMintTransactionInstruction = (0, spl_token_1.createInitializeMintInstruction)(mintKeypair.publicKey, decimals, ownerKeypair.publicKey, null);
    instructions.push(createAccountTransactionInstruction, createMintTransactionInstruction);
});
const executeMintInstructions = (connection, instructions, mintKeypairs, ownerKeypair) => __awaiter(void 0, void 0, void 0, function* () {
    const mintTransaction = new web3_js_1.Transaction();
    mintTransaction.add(...instructions);
    mintTransaction.feePayer = ownerKeypair.publicKey;
    yield (0, web3_js_1.sendAndConfirmTransaction)(connection, mintTransaction, [...mintKeypairs, ownerKeypair]);
    return true;
});
const mintDelegateTokenForDelegate = (connection, ownerKeypair, delegateMintPublicKey, delegateKeypair) => __awaiter(void 0, void 0, void 0, function* () {
    const delegateAta = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, ownerKeypair, delegateMintPublicKey, delegateKeypair.publicKey);
    const mintToTransactionInstruction = (0, spl_token_1.createMintToInstruction)(delegateMintPublicKey, delegateAta.address, ownerKeypair.publicKey, 1);
    const mintToTransaction = new web3_js_1.Transaction();
    mintToTransaction.add(mintToTransactionInstruction);
    mintToTransaction.feePayer = ownerKeypair.publicKey;
    yield (0, web3_js_1.sendAndConfirmTransaction)(connection, mintToTransaction, [ownerKeypair]);
});
const mintMaxLpTokens = (connection, payer, mint, owner, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerAta = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, payer, mint, owner);
    yield (0, spl_token_1.mintTo)(connection, payer, mint, ownerAta.address, owner, amount);
    return ownerAta.address;
});
const createRealm = (connection, governanceProgramId, ownerKeypair, councilMintPublicKey, communityMintPublicKey, name) => __awaiter(void 0, void 0, void 0, function* () {
    let transactionInstructions = [];
    const minCommunityWeightToCreateGovernance = new bn_js_1.default(web3_js_1.LAMPORTS_PER_SOL * 1000000);
    const realmAddress = yield (0, withCreateRealm_1.withCreateRealm)(transactionInstructions, governanceProgramId, 2, name, ownerKeypair.publicKey, communityMintPublicKey, ownerKeypair.publicKey, councilMintPublicKey, accounts_1.MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION, minCommunityWeightToCreateGovernance);
    const tx = new web3_js_1.Transaction();
    tx.add(...transactionInstructions);
    tx.feePayer = ownerKeypair.publicKey;
    yield (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [ownerKeypair]);
    return realmAddress;
});
const createTreasuryAccount = (connection, ownerKeypair, mintPublicKey, governancePublicKey) => __awaiter(void 0, void 0, void 0, function* () {
    const mintAtaPublicKey = (yield web3_js_1.PublicKey.findProgramAddress([
        governancePublicKey.toBuffer(),
        spl_token_1.TOKEN_PROGRAM_ID.toBuffer(),
        mintPublicKey.toBuffer(),
    ], spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID))[0];
    const transactionInstruction = (0, spl_token_1.createAssociatedTokenAccountInstruction)(ownerKeypair.publicKey, mintAtaPublicKey, governancePublicKey, mintPublicKey);
    const tx = new web3_js_1.Transaction();
    tx.add(transactionInstruction);
    tx.feePayer = ownerKeypair.publicKey;
    yield (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [ownerKeypair]);
    return mintAtaPublicKey;
});
const depositDelegateCouncilTokenInGovernance = (connection, governanceProgramId, delegateKeypair, ownerKeypair, realmPublicKey, delegateMintPublicKey) => __awaiter(void 0, void 0, void 0, function* () {
    let instruction = [];
    const delegateAta = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, ownerKeypair, delegateMintPublicKey, delegateKeypair.publicKey);
    yield (0, withDepositGoverningTokens_1.withDepositGoverningTokens)(instruction, governanceProgramId, 2, // why does program 2 work and not program 1
    realmPublicKey, delegateAta.address, delegateMintPublicKey, delegateKeypair.publicKey, delegateKeypair.publicKey, delegateKeypair.publicKey, new bn_js_1.default(1));
    const tx = new web3_js_1.Transaction();
    tx.add(...instruction);
    tx.feePayer = delegateKeypair.publicKey;
    yield (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [delegateKeypair]);
});
const createGovernances = (connection, governanceProgramId, governanceConfig, ownerKeypair, realmPublicKey, delegateMintPublicKey, limitedPartnerMintPublicKey, distributionMintPublicKey) => __awaiter(void 0, void 0, void 0, function* () {
    const [tokenOwnerRecordAddress] = yield web3_js_1.PublicKey.findProgramAddress([
        governanceProgramId.toBuffer(),
        realmPublicKey.toBuffer(),
        delegateMintPublicKey.toBuffer(),
        ownerKeypair.publicKey.toBuffer(),
    ], governanceProgramId);
    // Put limited partner and council mints under the realm governance with default config
    const config = new accounts_1.GovernanceConfig({
        voteThresholdPercentage: new accounts_1.VoteThresholdPercentage({
            value: governanceConfig.voteThresholdPercentage,
        }),
        minCommunityTokensToCreateProposal: new bn_js_1.default(governanceConfig.minCommunityTokensToCreateProposal),
        minInstructionHoldUpTime: governanceConfig.minInstructionHoldUpTime,
        maxVotingTime: governanceConfig.maxVotingTime,
        voteTipping: governanceConfig.voteTipping,
        proposalCoolOffTime: governanceConfig.proposalCoolOffTime,
        minCouncilTokensToCreateProposal: new bn_js_1.default(governanceConfig.minCouncilTokensToCreateProposal),
    });
    const instructions = [];
    const limitedPartnerGovernedAccountPublicKey = web3_js_1.Keypair.generate().publicKey;
    const limitedPartnerGovernancePublicKey = yield (0, withCreateGovernance_1.withCreateGovernance)(instructions, governanceProgramId, 2, realmPublicKey, limitedPartnerGovernedAccountPublicKey, config, tokenOwnerRecordAddress, ownerKeypair.publicKey, ownerKeypair.publicKey);
    const delegateMintGovernancePublicKey = yield (0, withCreateMintGovernance_1.withCreateMintGovernance)(instructions, governanceProgramId, 2, // why does program 2 work and not program 1
    realmPublicKey, delegateMintPublicKey, config, !!ownerKeypair.publicKey, ownerKeypair.publicKey, tokenOwnerRecordAddress, ownerKeypair.publicKey, ownerKeypair.publicKey);
    const distributionMintGovernancePublicKey = yield (0, withCreateMintGovernance_1.withCreateMintGovernance)(instructions, governanceProgramId, 2, // why does program 2 work and not program 1
    realmPublicKey, distributionMintPublicKey, config, !!ownerKeypair.publicKey, ownerKeypair.publicKey, tokenOwnerRecordAddress, ownerKeypair.publicKey, ownerKeypair.publicKey);
    const tx = new web3_js_1.Transaction();
    tx.add(...instructions);
    tx.feePayer = ownerKeypair.publicKey;
    yield (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [ownerKeypair]);
    return {
        limitedPartnerGovernedAccountPublicKey,
        limitedPartnerGovernancePublicKey,
        delegateMintGovernancePublicKey,
        distributionMintGovernancePublicKey
    };
});
const setLimitedPartnerGovernanceAsRealmAuthority = (connection, governanceProgramId, ownerKeypair, realmPublicKey, communityMintGovernancePublicKey) => __awaiter(void 0, void 0, void 0, function* () {
    const instructions = [];
    (0, withSetRealmAuthority_1.withSetRealmAuthority)(instructions, governanceProgramId, 2, realmPublicKey, ownerKeypair.publicKey, communityMintGovernancePublicKey, 1);
    const tx = new web3_js_1.Transaction();
    tx.add(...instructions);
    tx.feePayer = ownerKeypair.publicKey;
    yield (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [ownerKeypair]);
});
// helpers
function exec(command, { capture = false, echo = false, cwd = process.cwd() } = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        let parsedCommand = command.replace(/\\?\n/g, ''); // need to merge multi-line commands into one string
        if (echo) {
            console.log(parsedCommand);
        }
        const childProcess = (0, child_process_1.spawn)('bash', ['-c', parsedCommand], {
            stdio: capture ? 'pipe' : 'inherit',
            cwd: cwd
        });
        return new Promise((resolve, reject) => {
            // return new Promise<{code: number, data: string}>((resolve, reject) => {
            var _a;
            let stdout = '';
            if (capture) {
                (_a = childProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
                    stdout += data !== null && data !== void 0 ? data : "";
                });
            }
            childProcess.on('error', (error) => {
                reject({ code: 1, error: error });
            });
            childProcess.on('close', (code) => {
                if (code !== null && code !== void 0 ? code : 0 > 0) {
                    reject({ code: code !== null && code !== void 0 ? code : 0, error: 'Command failed with code ' + code });
                }
                else {
                    resolve({ code: code !== null && code !== void 0 ? code : 0, data: stdout.trim() });
                }
            });
        });
    });
}
function loadKeypair(fileRef) {
    return __awaiter(this, void 0, void 0, function* () {
        let filePath = fileRef;
        if (filePath[0] === '~') {
            filePath = path_1.default.join(process.env.HOME, filePath.slice(1));
        }
        let contents = fs.readFileSync(`${filePath}`);
        let parsed = String(contents)
            .replace("[", "")
            .replace("]", "")
            .split(",")
            .map((item) => Number(item));
        const uint8Array = Uint8Array.from(parsed);
        return web3_js_1.Keypair.fromSecretKey(uint8Array);
    });
}
const validateConfig = (config) => {
    return !!((0, underscore_1.isString)(config.cluster) &&
        (0, underscore_1.isString)(config.owner) &&
        (0, underscore_1.isString)(config.delegate) &&
        (0, underscore_1.isString)(config.name) &&
        (0, underscore_1.isString)(config.governanceProgramId) &&
        (0, underscore_1.isString)(config.usdcMint) &&
        (0, underscore_1.isNumber)(config.governance.voteThresholdPercentage) &&
        (0, underscore_1.isNumber)(config.governance.minCommunityTokensToCreateProposal) &&
        (0, underscore_1.isNumber)(config.governance.minInstructionHoldUpTime) &&
        (0, underscore_1.isNumber)(config.governance.maxVotingTime) &&
        (0, underscore_1.isNumber)(config.governance.voteTipping) &&
        (0, underscore_1.isNumber)(config.governance.proposalCoolOffTime) &&
        (0, underscore_1.isNumber)(config.governance.minCouncilTokensToCreateProposal));
};
