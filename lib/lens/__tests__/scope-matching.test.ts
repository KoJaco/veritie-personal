import {
    buildScopeCacheTag,
    buildLensPrefetchHrefs,
    SCOPE_ALL_BOUNDS,
    scopeIdsMatchLens,
    getScopeBound,
    filterScopeIdsForLens,
    type ScopeReadModelKey,
} from "@/lib/lens/scope-matching";
import type { ScopeKey, ScopeLens } from "@/lib/lens";

describe("scope matching helpers", () => {
    it("matches scope ids against lens scope", () => {
        expect(
            scopeIdsMatchLens(["operations-readiness"], {
                scope: "operations-readiness",
            }),
        ).toBe(true);
        expect(
            scopeIdsMatchLens(["operations-readiness"], {
                scope: "delivery-observability",
            }),
        ).toBe(false);
        expect(
            scopeIdsMatchLens(
                ["operations-readiness", "delivery-observability"],
                { scope: "delivery-observability" },
            ),
        ).toBe(true);
    });

    it("filters scope ids according to lens", () => {
        const scopeIds: ScopeKey[] = [
            "operations-readiness",
            "delivery-observability",
            "workspace-resilience",
        ];
        expect(filterScopeIdsForLens(scopeIds, { scope: "all" })).toEqual(
            scopeIds,
        );
        expect(
            filterScopeIdsForLens(scopeIds, { scope: "operations-readiness" }),
        ).toEqual(["operations-readiness"]);
        expect(
            filterScopeIdsForLens(scopeIds, {
                scope: "delivery-observability",
            }),
        ).toEqual(["delivery-observability"]);
        expect(
            filterScopeIdsForLens(scopeIds, { scope: "workspace-resilience" }),
        ).toEqual(["workspace-resilience"]);
    });

    it("bounds all-scope requests deterministically", () => {
        expect(
            getScopeBound({
                lens: { scope: "all" },
                surface: "dashboard",
                requested: 999,
            }),
        ).toBe(SCOPE_ALL_BOUNDS.dashboard);
        expect(
            getScopeBound({
                lens: { scope: "operations-readiness" },
                surface: "dashboard",
                requested: 999,
            }),
        ).toBe(999);
    });

    it("builds deterministic cache tags from normalized lens details", () => {
        const readModel: ScopeReadModelKey = "dashboard_metrics";
        const lens: ScopeLens = {
            scope: "delivery-observability",
        };
        expect(buildScopeCacheTag(readModel, lens)).toBe(
            "scope_view:v1:dashboard_metrics:delivery-observability",
        );
    });

    it("returns bounded prefetch hrefs across primary dashboard surfaces", () => {
        expect(
            buildLensPrefetchHrefs({ scope: "operations-readiness" }),
        ).toEqual([
            "/work?scope=operations-readiness",
            "/work/tasks?scope=operations-readiness",
            "/work/resources?scope=operations-readiness",
            "/work/documents?scope=operations-readiness",
            "/work/scopes?scope=operations-readiness",
        ]);
    });
});
