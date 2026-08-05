import {
    DATA_SOURCE_ENV_KEY,
    getDataSourceAdapters,
    getDataSourceKind,
} from "@/lib/data-source";

describe("data-source registry", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = originalEnv;
    });

    it("defaults to stub when env is unset and DATABASE_URL is absent", () => {
        delete process.env.DATABASE_URL;
        expect(getDataSourceKind(undefined)).toBe("stub");
    });

    it("defaults to stub for unknown env values when DATABASE_URL is absent", () => {
        delete process.env.DATABASE_URL;
        expect(getDataSourceKind("anything")).toBe("stub");
    });

    it("selects backend for explicit backend env value", () => {
        expect(getDataSourceKind("backend")).toBe("backend");
    });

    it("auto-selects backend when DATABASE_URL is set", () => {
        process.env.DATABASE_URL = "postgres://localhost/test";
        expect(getDataSourceKind(undefined)).toBe("backend");
    });

    it("prefers stub when explicitly configured even with DATABASE_URL", () => {
        process.env.DATABASE_URL = "postgres://localhost/test";
        expect(getDataSourceKind("stub")).toBe("stub");
    });

    it("returns deterministic adapter set from chosen kind", () => {
        const stubAdapters = getDataSourceAdapters("stub");
        const backendAdapters = getDataSourceAdapters("backend");

        expect(stubAdapters.settings.getSettings).toBeDefined();
        expect(backendAdapters.settings.getSettings).toBeDefined();
        expect(stubAdapters).not.toBe(backendAdapters);
    });

    it("reads default kind from the configured env key", () => {
        const previous = process.env[DATA_SOURCE_ENV_KEY];
        delete process.env.DATABASE_URL;
        process.env[DATA_SOURCE_ENV_KEY] = "backend";
        expect(getDataSourceAdapters().settings.getSettings).toBeDefined();
        process.env[DATA_SOURCE_ENV_KEY] = previous;
    });
});
