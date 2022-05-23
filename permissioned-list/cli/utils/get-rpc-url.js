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
exports.getRpcUrl = void 0;
const fs_1 = __importDefault(require("fs"));
function getRpcUrl() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const configFileLocation = (_a = process.env.CONFIG) !== null && _a !== void 0 ? _a : "";
        const configFileContent = fs_1.default.readFileSync(configFileLocation);
        const config = configFileContent.toString();
        let rpcUrl = config.match(".*(?:json_rpc_url: )(.*)")[1];
        return rpcUrl;
    });
}
exports.getRpcUrl = getRpcUrl;
