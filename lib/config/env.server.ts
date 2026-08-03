/**
 * Server-only environment configuration
 *
 * These variables are NOT prefixed with NEXT_PUBLIC_ and are only available on the server.
 * These may contain sensitive secrets and should never be exposed to the browser.
 */

function getEnvVarOptional(
    key: string,
    defaultValue?: string
): string | undefined {
    const value = process.env[key];
    return value ?? defaultValue;
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
} as const;
