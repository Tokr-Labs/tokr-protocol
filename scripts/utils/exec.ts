import {spawn} from "child_process";

/**
 * Executes shell command as it would happen in BASH script
 * @param {string} command
 * @param {Object} [options] Object with options. Set `capture` to TRUE, to capture and return stdout.
 *                           Set `echo` to TRUE, to echo command passed.
 * @returns {Promise<{code: number, data: string | undefined, error: Object}>}
 */

export function exec(command: string, {capture = false, echo = false, cwd = process.cwd()} = {}) {

    let parsedCommand = command.replace(/\\?\n/g, ''); // need to merge multi-line commands into one string

    if (echo) {
        console.log(parsedCommand);
    }

    const childProcess = spawn(
        'bash',
        ['-c', parsedCommand],
        {
            stdio: capture ? 'pipe' : 'inherit',
            cwd: cwd
        }
    );

    return new Promise<{code: number, data: string}>((resolve, reject) => {

        let stdout = '';

        if (capture) {
            childProcess.stdout?.on('data', (data) => {
                stdout += data ?? "";
            });
        }

        childProcess.on('error', (error) => {
            reject({code: 1, error: error});
        });

        childProcess.on('close', (code) => {
            if (code ?? 0 > 0) {
                reject({code: code ?? 0, error: 'Command failed with code ' + code});
            } else {
                resolve({code: code ?? 0, data: stdout.trim()});
            }
        });

    });
}