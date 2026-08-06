/**
 * Phase 6 security scan — grep client bundles for server secret env key names.
 * Run after: npm run build
 * Usage: node scripts/phase-6-security-scan.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const staticDir = resolve(root, ".next/static");

const FORBIDDEN_SUBSTRINGS = [
    "VERITIE_API_KEY",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY",
    "CAPTURES_PERSIST_SECRET",
    "AUTH_WEBHOOK_SECRET",
];

function collectFiles(dir, acc = []) {
    if (!statSync(dir, { throwIfNoEntry: false })) {
        return acc;
    }
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        const stat = statSync(path);
        if (stat.isDirectory()) {
            collectFiles(path, acc);
        } else if (/\.(js|mjs|cjs|json|txt|map)$/.test(entry)) {
            acc.push(path);
        }
    }
    return acc;
}

const files = collectFiles(staticDir);
const hits = [];

for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const needle of FORBIDDEN_SUBSTRINGS) {
        if (content.includes(needle)) {
            hits.push({ file, needle });
        }
    }
}

console.log("Phase 6 client bundle secret scan");
console.log(`Scanned ${files.length} files under .next/static\n`);

if (hits.length === 0) {
    console.log("No forbidden secret key names found in client bundles.");
    process.exit(0);
}

console.log("FAIL — possible secret leakage:");
for (const { file, needle } of hits) {
    console.log(`  ${needle} in ${file}`);
}
process.exit(1);
