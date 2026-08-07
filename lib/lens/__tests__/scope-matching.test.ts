import {
    scopeIdsMatchLens,
    filterScopeIdsForLens,
    buildLensPrefetchHrefs,
} from "@/lib/lens";
import type { ScopeKey, ScopeLens } from "@/lib/lens";

describe("scope matching helpers", () => {
    it("matches scope ids against lens scope", () => {
        expect(
            scopeIdsMatchLens(["work"], { scope: "work" }),
        ).toBe(true);
        expect(
            scopeIdsMatchLens(["work"], { scope: "finance" }),
        ).toBe(false);
        expect(
            scopeIdsMatchLens(["work", "finance"], { scope: "finance" }),
        ).toBe(true);
    });

    it("filters scope ids according to lens", () => {
        const scopeIds: ScopeKey[] = ["work", "finance", "personal"];
        expect(filterScopeIdsForLens(scopeIds, { scope: "all" })).toEqual(
            scopeIds,
        );
        expect(filterScopeIdsForLens(scopeIds, { scope: "work" })).toEqual([
            "work",
        ]);
        expect(filterScopeIdsForLens(scopeIds, { scope: "finance" })).toEqual([
            "finance",
        ]);
        expect(filterScopeIdsForLens(scopeIds, { scope: "personal" })).toEqual([
            "personal",
        ]);
    });

    it("returns bounded prefetch hrefs across primary dashboard surfaces", () => {
        expect(buildLensPrefetchHrefs({ scope: "work" })).toEqual([
            "/timeline?aspect=work",
            "/captures?aspect=work",
            "/events?aspect=work",
            "/reminders?aspect=work",
            "/tasks?aspect=work",
            "/goals?aspect=work",
            "/money?aspect=work",
            "/records?aspect=work",
            "/resources?aspect=work",
        ]);
    });
});
