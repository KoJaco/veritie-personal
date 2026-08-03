import { access, constants, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sdkDir = path.join(rootDir, "sdk");
const distEntry = path.join(sdkDir, "dist", "index.js");
const srcDir = path.join(sdkDir, "src");

async function exists(filePath) {
    try {
        await access(filePath, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

async function newestMtimeMs(dirPath) {
    const { readdir } = await import("node:fs/promises");
    let newest = 0;

    async function walk(currentPath) {
        const entries = await readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const entryPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                await walk(entryPath);
                continue;
            }

            if (!/\.(ts|tsx)$/.test(entry.name)) {
                continue;
            }

            const { mtimeMs } = await stat(entryPath);
            newest = Math.max(newest, mtimeMs);
        }
    }

    await walk(dirPath);
    return newest;
}

async function sdkNeedsBuild() {
    if (!(await exists(distEntry))) {
        return true;
    }

    const [distMtimeMs, srcMtimeMs] = await Promise.all([
        stat(distEntry).then((stats) => stats.mtimeMs),
        newestMtimeMs(srcDir),
    ]);

    return srcMtimeMs > distMtimeMs;
}

if (!(await sdkNeedsBuild())) {
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
