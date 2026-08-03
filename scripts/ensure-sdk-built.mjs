import { access, constants } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = path.join(rootDir, "sdk", "dist", "index.js");

async function distExists() {
    try {
        await access(distEntry, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

if (await distExists()) {
    process.exit(0);
}

const result = spawnSync("npm", ["run", "build", "--prefix", "sdk"], {
    cwd: rootDir,
    stdio: "inherit",
    shell: false,
});

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}
