import { normalizeError } from "../normalize";

describe("normalizeError", () => {
    describe("null/undefined handling", () => {
        it("should handle null errors", () => {
            const result = normalizeError(null);
            expect(result.name).toBe("UnknownError");
            expect(result.message).toBe("An unknown error occurred");
            expect(result.code).toBeUndefined();
            expect(result.stack).toBeUndefined();
        });

        it("should handle undefined errors", () => {
            const result = normalizeError(undefined);
            expect(result.name).toBe("UnknownError");
            expect(result.message).toBe("An unknown error occurred");
        });
    });

    describe("Error instance handling", () => {
        it("should normalize standard Error instances", () => {
            const error = new Error("Test error message");
            const result = normalizeError(error);

            expect(result.name).toBe("Error");
            expect(result.message).toBe("Test error message");
            expect(result.code).toBeUndefined();
        });

        it("should include stack trace when includeStack is true", () => {
            const error = new Error("Test error");
            const result = normalizeError(error, true);

            expect(result.stack).toBeDefined();
            expect(result.stack).toContain("Error: Test error");
        });

        it("should exclude stack trace when includeStack is false", () => {
            const error = new Error("Test error");
            const result = normalizeError(error, false);

            expect(result.stack).toBeUndefined();
        });

        it("should extract error code from error.code", () => {
            const error = new Error("Test") as Error & { code: string };
            error.code = "ERR_TEST";
            const result = normalizeError(error);

            expect(result.code).toBe("ERR_TEST");
        });

        it("should extract error code from error.statusCode", () => {
            const error = new Error("Test") as Error & { statusCode: number };
            error.statusCode = 404;
            const result = normalizeError(error);

            expect(result.code).toBe("404");
        });

        it("should extract error code from error.status", () => {
            const error = new Error("Test") as Error & { status: number };
            error.status = 500;
            const result = normalizeError(error);

            expect(result.code).toBe("500");
        });

        it("should preserve error cause", () => {
            const cause = new Error("Root cause");
            const error = new Error("Wrapper error", { cause });
            const result = normalizeError(error);

            expect(result.cause).toBe(cause);
        });
    });

    describe("string error handling", () => {
        it("should normalize string errors", () => {
            const result = normalizeError("String error message");

            expect(result.name).toBe("StringError");
            expect(result.message).toBe("String error message");
        });

        it("should handle empty strings", () => {
            const result = normalizeError("");

            expect(result.name).toBe("StringError");
            expect(result.message).toBe("");
        });
    });

    describe("object error handling", () => {
        it("should normalize object errors with message", () => {
            const error = { message: "Object error", code: "OBJ_001" };
            const result = normalizeError(error);

            expect(result.name).toBe("ObjectError");
            expect(result.message).toBe("Object error");
            expect(result.code).toBe("OBJ_001");
        });

        it("should use error property if message is missing", () => {
            const error = { error: "Error property" };
            const result = normalizeError(error);

            expect(result.message).toBe("Error property");
        });

        it("should use string representation if neither message nor error exists", () => {
            const error = { someProperty: "value" };
            const result = normalizeError(error);

            expect(result.message).toBeDefined();
            expect(result.message.length).toBeGreaterThan(0);
        });

        it("should extract name from object", () => {
            const error = { name: "CustomError", message: "Test" };
            const result = normalizeError(error);

            expect(result.name).toBe("CustomError");
        });

        it("should include stack from object when includeStack is true", () => {
            const stack = "Error: Test\n    at test.ts:1";
            const error = { message: "Test", stack };
            const result = normalizeError(error, true);

            expect(result.stack).toBe(stack);
        });
    });

    describe("primitive handling", () => {
        it("should handle number errors", () => {
            const result = normalizeError(42);

            expect(result.name).toBe("number");
            expect(result.message).toBe("42");
        });

        it("should handle boolean errors", () => {
            const result = normalizeError(true);

            expect(result.name).toBe("boolean");
            expect(result.message).toBe("true");
        });
    });
});
