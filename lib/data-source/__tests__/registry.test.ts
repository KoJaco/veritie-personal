import {
    DATA_SOURCE_ENV_KEY,
    getDataSourceAdapters,
    getDataSourceKind,
} from "@/lib/data-source";

describe("data-source registry", () => {
    it("defaults to stub when env is unset", () => {
        expect(getDataSourceKind(undefined)).toBe("stub");
    });

    it("defaults to stub for unknown env values", () => {
        expect(getDataSourceKind("anything")).toBe("stub");
    });

    it("selects backend only for explicit backend env value", () => {
        expect(getDataSourceKind("backend")).toBe("backend");
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
        process.env[DATA_SOURCE_ENV_KEY] = "backend";
        expect(getDataSourceAdapters().settings.getSettings).toBeDefined();
        process.env[DATA_SOURCE_ENV_KEY] = previous;
    });
});
