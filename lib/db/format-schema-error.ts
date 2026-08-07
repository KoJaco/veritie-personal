/**
 * Surfaces actionable messages when Drizzle/Postgres errors indicate schema drift.
 */
export function formatDbSchemaError(error: unknown): string | null {
    const message =
        error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "";

    if (
        message.includes("index_artifact") ||
        message.includes("extraction_payload")
    ) {
        return "Database schema is out of date. Run npm run db:migrate (migration 0002_flawless_kitty_pryde adds voice log index columns).";
    }

    return null;
}

export function toCapturePersistError(error: unknown): Error {
    const schemaHint = formatDbSchemaError(error);
    if (schemaHint) {
        return new Error(schemaHint);
    }

    if (error instanceof Error) {
        return error;
    }

    return new Error(String(error));
}
