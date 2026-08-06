/**
 * Phase 6 automated smoke — runs Jest suites that cover E2E-adjacent flows.
 * Usage: node scripts/phase-6-e2e-smoke.mjs
 */

import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const suites = [
    { label: "proxy", args: ["proxy.test.ts"] },
    { label: "safe-redirect", args: ["lib/auth/__tests__/safe-redirect.test.ts"] },
    { label: "chat API", args: ["app/api/chat/__tests__/route.test.ts"] },
    {
        label: "attachments API",
        args: ["app/api/attachments/versions/__tests__/route.test.ts"],
    },
    {
        label: "veritie proxy API",
        args: ["--testPathPattern", "veritie/v1"],
    },
    {
        label: "settings actions",
        args: ["--testPathPattern", "settings/__tests__/actions"],
    },
    {
        label: "records page",
        args: ["--testPathPattern", "records/__tests__/page"],
    },
    {
        label: "capture persist",
        args: ["lib/capture/__tests__/persist-capture-from-job.test.ts"],
    },
];

console.log("Phase 6 automated E2E smoke (Jest)\n");

let failed = false;
for (const { label, args } of suites) {
    console.log(`→ ${label}`);
    const result = spawnSync("npx", ["--yes", "jest", ...args, "--runInBand"], {
        cwd: root,
        stdio: "inherit",
        shell: false,
    });
    if (result.status !== 0) {
        failed = true;
    }
}

if (failed) {
    console.error("\nSmoke suites failed.");
    process.exit(1);
}

console.log("\nAll smoke suites passed.");
console.log(
    "Manual still required: Google OAuth flows, voice capture E2E, RLS JWT SQL checks.",
);
