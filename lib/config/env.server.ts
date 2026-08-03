/**
 * Server-only environment configuration
 *
 * These variables are NOT prefixed with NEXT_PUBLIC_ and are only available on the server.
 * These may contain sensitive secrets and should never be exposed to the browser.
 */

import { getBooleanEnvVar, getEnvVarOptional } from "./utils";

function resolveAllowStubCaptureMutations(): boolean {
    const explicit = process.env.ALLOW_STUB_CAPTURE_MUTATIONS;
    if (explicit !== undefined) {
        return explicit === "true" || explicit === "1";
    }
    const nodeEnv = process.env.NODE_ENV;
    return nodeEnv === "development" || nodeEnv === "test";
}

export const envServer = {
    // Runtime env
    nodeEnv: getEnvVarOptional("NODE_ENV") as
        | "development"
        | "staging"
        | "production"
        | "test"
        | undefined,

    // Auth secrets (server-only)
    // TODO: which auth provider are we using?
    authServiceRoleKey: getEnvVarOptional("AUTH_SERVICE_ROLE_KEY"),
    authWebhookSecret: getEnvVarOptional("AUTH_WEBHOOK_SECRET"),

    // Veritie server credentials (captures persist)
    veritieApiUrl: getEnvVarOptional("VERITIE_API_URL"),
    veritiePipelineAlias: getEnvVarOptional("VERITIE_PIPELINE_ALIAS"),
    veritieApiKey: getEnvVarOptional("VERITIE_API_KEY"),

    // Interim gate for POST /api/captures until session auth lands
    capturesPersistSecret: getEnvVarOptional("CAPTURES_PERSIST_SECRET"),

    // Stub read-model mutations (dev/test default on, production default off)
    allowStubCaptureMutations: resolveAllowStubCaptureMutations(),
} as const;
