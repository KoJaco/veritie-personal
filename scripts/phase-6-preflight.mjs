/**
 * Phase 6 preflight — env and migration inventory (no secret values printed).
 * Usage: node scripts/phase-6-preflight.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED_FOR_BACKEND_E2E = [
    "DATABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
    "VERITIE_API_URL",
    "VERITIE_PIPELINE_ALIAS",
    "VERITIE_API_KEY",
];

const OPTIONAL_BUT_RECOMMENDED = [
    "OPENAI_API_KEY",
    "PLATFORM_SHELL_FE_DATA_SOURCE",
    "NEXT_PUBLIC_APP_ENV",
];

function loadEnvFile() {
    const path = resolve(root, ".env");
    if (!existsSync(path)) {
        return {};
    }
    const vars = {};
    for (const line of readFileSync(path, "utf8").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim();
        vars[key] = value;
    }
    return vars;
}

function mergeEnv(fileVars) {
    const merged = { ...fileVars };
    for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined && value !== "") {
            merged[key] = value;
        }
    }
    return merged;
}

function listMigrations() {
    const journalPath = resolve(root, "db/migrations/meta/_journal.json");
    if (!existsSync(journalPath)) {
        return [];
    }
    const journal = JSON.parse(readFileSync(journalPath, "utf8"));
    return journal.entries?.map((e) => e.tag) ?? [];
}

const env = mergeEnv(loadEnvFile());
const missing = REQUIRED_FOR_BACKEND_E2E.filter(
    (key) => !env[key] || env[key].length === 0,
);
const missingOptional = OPTIONAL_BUT_RECOMMENDED.filter(
    (key) => !env[key] || env[key].length === 0,
);

console.log("Phase 6 preflight\n");

console.log("Drizzle migrations in repo:");
for (const tag of listMigrations()) {
    console.log(`  - ${tag}`);
}
console.log(
    "\nConfirm these are applied on target Supabase (npm run db:migrate or dashboard).\n",
);

if (missing.length === 0) {
    console.log("Required env vars: all set");
} else {
    console.log("Missing required env vars:");
    for (const key of missing) {
        console.log(`  - ${key}`);
    }
}

if (missingOptional.length > 0) {
    console.log("\nOptional / recommended (unset):");
    for (const key of missingOptional) {
        console.log(`  - ${key}`);
    }
}

if (env.PLATFORM_SHELL_FE_DATA_SOURCE !== "backend") {
    console.log(
        "\nNote: set PLATFORM_SHELL_FE_DATA_SOURCE=backend for persistence E2E.",
    );
}

console.log("\nSupabase manual steps:");
console.log("  1. Apply db/rls/04_policies_privilege.sql (if not already)");
console.log("  2. Run db/rls/05_verify_privilege.sql as user JWT");
console.log(
    "  3. Auth → Google → redirect URLs include https://<host>/auth/callback",
);

process.exit(missing.length > 0 ? 1 : 0);
