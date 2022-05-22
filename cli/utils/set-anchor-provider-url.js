"use strict";
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
exports.setAnchorProviderUrl = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function setAnchorProviderUrl() {
    return __awaiter(this, void 0, void 0, function* () {
        const cwd = process.cwd();
        // hijack cwd so that it returns the correct location
        process.cwd = () => {
            return path_1.default.resolve(cwd, "../../");
        };
        // @ts-ignore
        const content = fs_1.default.readFileSync(process.env.CONFIG.toString());
        const config = content.toString();
        let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")[1];
        rpcUrl = rpcUrl.replace(/(")+/gi, "");
        process.env.ANCHOR_PROVIDER_URL = rpcUrl;
    });
}
exports.setAnchorProviderUrl = setAnchorProviderUrl;
