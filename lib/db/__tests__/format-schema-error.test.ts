import { describe, expect, it } from "@jest/globals";

import {
    formatDbSchemaError,
    toCapturePersistError,
} from "@/lib/db/format-schema-error";

describe("lib/db/format-schema-error", () => {
    it("detects missing voice log artifact columns", () => {
        const hint = formatDbSchemaError(
            new Error(
                'column "index_artifact" of relation "voice_logs" does not exist',
            ),
        );
        expect(hint).toContain("db:migrate");
        expect(hint).toContain("0002_flawless_kitty_pryde");
    });

    it("returns null for unrelated database errors", () => {
        expect(formatDbSchemaError(new Error("connection refused"))).toBeNull();
    });

    it("wraps schema drift errors for capture persist", () => {
        const error = toCapturePersistError(
            new Error("Failed query: insert into voice_logs index_artifact"),
        );
        expect(error.message).toContain("db:migrate");
    });
});
