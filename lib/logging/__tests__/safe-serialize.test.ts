import { safeStringify, safeStringifyForLogging } from "../safe-serialize";

describe("safeStringify", () => {
    it("should serialize simple objects", () => {
        const obj = { name: "test", value: 123 };
        const result = safeStringify(obj);
        const parsed = JSON.parse(result);
        expect(parsed.name).toBe("test");
        expect(parsed.value).toBe(123);
    });

    it("should handle circular references", () => {
        const obj: Record<string, unknown> = { name: "test" };
        obj.self = obj;

        const result = safeStringify(obj);
        const parsed = JSON.parse(result);

        expect(parsed.name).toBe("test");
        expect(parsed.self).toBe("[Circular]");
    });

    it("should handle functions", () => {
        const obj = {
            name: "test",
            fn: () => "test",
        };

        const result = safeStringify(obj);
        const parsed = JSON.parse(result);

        expect(parsed.name).toBe("test");
        expect(parsed.fn).toBe("[Function]");
    });

    it("should handle symbols", () => {
        const sym = Symbol("test");
        const obj = { name: "test", symbol: sym };

        const result = safeStringify(obj);
        const parsed = JSON.parse(result);

        expect(parsed.name).toBe("test");
        expect(parsed.symbol).toBe("[Symbol]");
    });

    it("should handle BigInt", () => {
        const obj = { name: "test", big: BigInt(123) };

        const result = safeStringify(obj);
        const parsed = JSON.parse(result);

        expect(parsed.name).toBe("test");
        expect(parsed.big).toBe("[BigInt]");
    });

    it("should handle Date objects", () => {
        const date = new Date("2026-01-02T00:00:00Z");
        const obj = { name: "test", date };

        const result = safeStringify(obj);
        const parsed = JSON.parse(result);

        expect(parsed.name).toBe("test");
        expect(parsed.date).toBe(date.toISOString());
    });

    it("should handle Error objects", () => {
        const error = new Error("Test error");
        const obj = { name: "test", error };

        const result = safeStringify(obj);
        const parsed = JSON.parse(result);

        expect(parsed.name).toBe("test");
        expect(parsed.error.name).toBe("Error");
        expect(parsed.error.message).toBe("Test error");
        expect(parsed.error.stack).toBeDefined();
    });

    it("should handle RegExp objects", () => {
        const regex = /test/gi;
        const obj = { name: "test", regex };

        const result = safeStringify(obj);
        const parsed = JSON.parse(result);

        expect(parsed.name).toBe("test");
        expect(parsed.regex).toBe("/test/gi");
    });

    it("should handle Map objects", () => {
        const map = new Map([
            ["key1", "value1"],
            ["key2", "value2"],
        ]);
        const obj = { name: "test", map };

        const result = safeStringify(obj);
        const parsed = JSON.parse(result);

        expect(parsed.name).toBe("test");
        expect(parsed.map.key1).toBe("value1");
        expect(parsed.map.key2).toBe("value2");
    });

    it("should handle Set objects", () => {
        const set = new Set([1, 2, 3]);
        const obj = { name: "test", set };

        const result = safeStringify(obj);
        const parsed = JSON.parse(result);

        expect(parsed.name).toBe("test");
        expect(Array.isArray(parsed.set)).toBe(true);
        expect(parsed.set).toContain(1);
        expect(parsed.set).toContain(2);
        expect(parsed.set).toContain(3);
    });

    it("should skip private fields (starting with _)", () => {
        const obj = {
            name: "test",
            _private: "hidden",
            _alsoPrivate: "hidden",
            public: "visible",
        };

        const result = safeStringify(obj);
        const parsed = JSON.parse(result);

        expect(parsed.name).toBe("test");
        expect(parsed.public).toBe("visible");
        expect(parsed._private).toBeUndefined();
        expect(parsed._alsoPrivate).toBeUndefined();
    });

    it("should handle arrays", () => {
        const arr = [1, 2, { nested: "value" }];
        const result = safeStringify(arr);
        const parsed = JSON.parse(result);

        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed[0]).toBe(1);
        expect(parsed[1]).toBe(2);
        expect(parsed[2].nested).toBe("value");
    });

    it("should handle null and undefined", () => {
        const obj = {
            name: "test",
            nullValue: null,
            undefinedValue: undefined,
        };
        const result = safeStringify(obj);
        const parsed = JSON.parse(result);

        expect(parsed.name).toBe("test");
        expect(parsed.nullValue).toBeNull();
        expect(parsed.undefinedValue).toBeNull();
    });

    it("should support pretty printing with space parameter", () => {
        const obj = { name: "test", value: 123 };
        const result = safeStringify(obj, 2);

        expect(result).toContain("\n");
        expect(result).toContain('  "name"');
    });
});

describe("safeStringifyForLogging", () => {
    it("should limit depth", () => {
        const obj = {
            level1: {
                level2: {
                    level3: {
                        level4: {
                            level5: {
                                level6: "deep",
                            },
                        },
                    },
                },
            },
        };

        const result = safeStringifyForLogging(obj, 3);
        const parsed = JSON.parse(result);

        expect(parsed.level1.level2.level3).toBe("[MaxDepth]");
    });

    it("should limit array length", () => {
        const arr = Array.from({ length: 150 }, (_, i) => i);
        const result = safeStringifyForLogging(arr, 5, 100);
        const parsed = JSON.parse(result);

        expect(parsed.length).toBe(101); // 100 items + 1 "[50 more items]" message
        expect(parsed[100]).toContain("more items");
    });

    it("should limit object property count", () => {
        const obj: Record<string, number> = {};
        for (let i = 0; i < 150; i++) {
            obj[`prop${i}`] = i;
        }

        const result = safeStringifyForLogging(obj, 5, 100);
        const parsed = JSON.parse(result);

        const keys = Object.keys(parsed);
        expect(keys.length).toBeLessThanOrEqual(101); // 100 props + "[more]" key
        expect(parsed["[more]"]).toBeDefined();
    });

    it("should handle all the same edge cases as safeStringify", () => {
        const circular: Record<string, unknown> = {};
        const obj: Record<string, unknown> = {
            circular,
            fn: () => "test",
            date: new Date(),
            error: new Error("test"),
        };
        circular.self = circular;

        const result = safeStringifyForLogging(obj);
        const parsed = JSON.parse(result);

        expect(parsed.fn).toBe("[Function]");
        expect(parsed.date).toBeDefined();
        expect(parsed.error.name).toBe("Error");
    });
});
