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
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
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
module.exports.exec = exec;
