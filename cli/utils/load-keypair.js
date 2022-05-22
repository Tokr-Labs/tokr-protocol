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
exports.loadKeypair = void 0;
const fs_1 = __importDefault(require("fs"));
const web3_js_1 = require("@solana/web3.js");
const path_1 = __importDefault(require("path"));
function loadKeypair(fileRef) {
    return __awaiter(this, void 0, void 0, function* () {
        let filePath = fileRef;
        if (filePath[0] === '~') {
            filePath = path_1.default.join(process.env.HOME, filePath.slice(1));
        }
        let contents = yield fs_1.default.readFileSync(`${filePath}`);
        let parsed = String(contents)
            .replace("[", "")
            .replace("]", "")
            .split(",")
            .map((item) => Number(item));
        const uint8Array = Uint8Array.from(parsed);
        return web3_js_1.Keypair.fromSecretKey(uint8Array);
    });
}
exports.loadKeypair = loadKeypair;
