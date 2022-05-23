import * as path from "path";

export function resolveHome(filepath: string) {

    const home = process.env.HOME ?? ""

    if (filepath[0] === '~') {
        return path.join(home, filepath.slice(1));
    }

    return filepath;
}