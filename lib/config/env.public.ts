/**
 * Public environment configuration
 *
 * These variables are prefixed with NEXT_PUBLIC_ and are exposed to the browser.
 * NO sensitive data allowed here yeah.
 */

import {
    getBooleanEnvVar,
    getEnvVar,
    getEnvVarOptional,
    getNumberEnvVar,
} from "./utils";

export const envPublic = {
    // App metadata
    appName: getEnvVar("NEXT_PUBLIC_APP_NAME", "Platform Shell"),
    appEnv: getEnvVarOptional("NEXT_PUBLIC_APP_ENV") as
        | "local"
        | "staging"
        | "production"
        | undefined,

    // API connectivity
    apiBaseUrl: getEnvVarOptional("NEXT_PUBLIC_API_BASE_URL"),

    // Build-time metadata
    gitSha: getEnvVar("NEXT_PUBLIC_GIT_SHA", "unknown"),

    // Auth (Supabase)
    authProvider: getEnvVarOptional("NEXT_PUBLIC_AUTH_PROVIDER"),
    supabaseUrl: getEnvVarOptional("NEXT_PUBLIC_SUPABASE_URL"),
    supabasePublishableKey:
        getEnvVarOptional("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ??
        getEnvVarOptional("NEXT_PUBLIC_SUPABASE_ANON_KEY"),

    // Feature flags
    featureSdui: getBooleanEnvVar("NEXT_PUBLIC_FEATURE_SDUI", true),

    // Logging
    logLevel: getEnvVarOptional("NEXT_PUBLIC_LOG_LEVEL") as
        | "debug"
        | "info"
        | "warn"
        | "error"
        | undefined,

    // Server-driven UI
    sduiSchemaVersion: getNumberEnvVar("NEXT_PUBLIC_SDUI_SCHEMA_VERSION", 1),
    sduiStrictMode: getBooleanEnvVar("NEXT_PUBLIC_SDUI_STRICT_MODE", true),

    // Veritie capture (browser uses /api/veritie proxy; these are optional overrides only)
    veritieApiUrl: getEnvVarOptional("NEXT_PUBLIC_VERITIE_API_URL"),
    veritiePipelineAlias: getEnvVarOptional(
        "NEXT_PUBLIC_VERITIE_PIPELINE_ALIAS",
    ),
    captureLauncherEnabled: getBooleanEnvVar(
        "NEXT_PUBLIC_CAPTURE_LAUNCHER_ENABLED",
        true,
    ),
} as const;
