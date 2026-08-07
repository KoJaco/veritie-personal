import {
    getLensParseResultFromSearchParams,
    getLensFromSearchParams,
    scopeKeyFromLens,
    isSoc2TypeII,
    mergeParams,
    normalizeLens,
    parseLens,
    parseLensResult,
    serializeLens,
    stripLensParams,
    withLens,
    withoutLens,
    buildLensPrefetchHrefs,
    filterScopeIdsForLens,
    LENS_INPUT_HARD_LIMIT_BYTES,
} from "@/lib/lens";

describe("lens utils (aspect bridge)", () => {
    it("normalizes malformed and partial lens input safely", () => {
        expect(normalizeLens(null)).toEqual({ scope: "all" });
        expect(normalizeLens(undefined)).toEqual({ scope: "all" });
        expect(normalizeLens({})).toEqual({ scope: "all" });
        expect(normalizeLens({ scope: "work" })).toEqual({ scope: "work" });
        expect(normalizeLens({ scope: "finance" })).toEqual({
            scope: "finance",
        });
        expect(normalizeLens({ scope: "not-real" as "work" })).toEqual({
            scope: "all",
        });
    });

    it("parses query params and degrades unknown values to all", () => {
        expect(parseLens(new URLSearchParams("aspect=work"))).toEqual({
            scope: "work",
        });
        expect(parseLens(new URLSearchParams("aspect=NOPE"))).toEqual({
            scope: "all",
        });
        expect(parseLens(new URLSearchParams("scope=finance"))).toEqual({
            scope: "all",
        });
    });

    it("returns parse issues for malformed lens params without leaking raw values", () => {
        const result = parseLensResult(new URLSearchParams("scope=bad"));

        expect(result.lens).toEqual({ scope: "all" });
        expect(result.inputSizeBytes).toBeGreaterThan(0);
        expect(result.issues).toEqual(
            expect.arrayContaining(["INVALID_SCOPE"]),
        );
    });

    it("rejects oversized lens input and fails closed to default lens", () => {
        const oversized = "x".repeat(LENS_INPUT_HARD_LIMIT_BYTES + 32);
        const result = getLensParseResultFromSearchParams(
            new URLSearchParams(`aspect=${oversized}`),
        );

        expect(result.lens).toEqual({ scope: "all" });
        expect(result.issues).toContain("OVERSIZED_INPUT");
        expect(result.inputSizeBytes).toBeGreaterThan(
            LENS_INPUT_HARD_LIMIT_BYTES,
        );
    });

    it("accounts for duplicate lens params in SearchParamRecord arrays when enforcing size limits", () => {
        const oversizedValue = "x".repeat(LENS_INPUT_HARD_LIMIT_BYTES + 32);
        const result = getLensParseResultFromSearchParams({
            aspect: [oversizedValue, oversizedValue],
        });

        expect(result.issues).toContain("OVERSIZED_INPUT");
        expect(result.lens).toEqual({ scope: "all" });
    });

    it("serializes deterministic canonical aspect params", () => {
        expect(serializeLens({ scope: "work" }).toString()).toBe("aspect=work");
        expect(serializeLens({ scope: "personal" }).toString()).toBe(
            "aspect=personal",
        );
        expect(serializeLens({ scope: "all" }).toString()).toBe("aspect=all");
    });

    it("applies and preserves lens in relative and absolute hrefs", () => {
        const relative = withLens("/tasks?focus=open", { scope: "work" });
        expect(relative).toContain("/tasks?");
        expect(relative).toContain("focus=open");
        expect(relative).toContain("aspect=work");

        const absolute = withLens(
            "https://example.com/records?status=missing",
            { scope: "finance" },
        );
        expect(absolute).toContain("https://example.com/records?");
        expect(absolute).toContain("status=missing");
        expect(absolute).toContain("aspect=finance");

        const withExtras = withLens(
            "/tasks?focus=open",
            { scope: "admin" },
            { focus: "blocked", status: "overdue", removeMe: null },
        );
        expect(withExtras).toContain("aspect=admin");
        expect(withExtras).toContain("focus=blocked");
        expect(withExtras).toContain("status=overdue");
        expect(withExtras).not.toContain("removeMe=");
    });

    it("removes lens params cleanly and maps scope keys", () => {
        const href = withoutLens("/tasks?aspect=work&foo=bar");
        expect(href).toBe("/tasks?foo=bar");

        expect(scopeKeyFromLens({ scope: "work" })).toBe("work");
        expect(scopeKeyFromLens({ scope: "personal" })).toBe("personal");
        expect(scopeKeyFromLens({ scope: "all" })).toBeNull();
    });

    it("covers stripLensParams, mergeParams, getLensFromSearchParams, and isSoc2TypeII", () => {
        const stripped = stripLensParams(
            new URLSearchParams("aspect=work&foo=bar"),
        );
        expect(stripped.toString()).toBe("foo=bar");

        const merged = mergeParams(new URLSearchParams("a=1&b=2"), {
            a: "3",
            b: undefined,
            c: ["x", "y"],
            d: null,
        });
        expect(merged.get("a")).toBe("3");
        expect(merged.has("b")).toBe(false);
        expect(merged.getAll("c")).toEqual(["x", "y"]);
        expect(merged.has("d")).toBe(false);

        expect(
            getLensFromSearchParams(new URLSearchParams("aspect=finance")),
        ).toEqual({ scope: "finance" });

        expect(isSoc2TypeII()).toBe(false);
    });

    it("preserves lens query state across dashboard route transitions", () => {
        const lens = { scope: "work" as const };

        const taskHref = withLens("/tasks?focus=open", lens);
        const recordsHref = withLens("/records?status=missing", lens);
        const timelineHref = withLens("/timeline?sort=updated", lens);

        const taskParams = new URLSearchParams(taskHref.split("?")[1]);
        const recordsParams = new URLSearchParams(recordsHref.split("?")[1]);
        const timelineParams = new URLSearchParams(timelineHref.split("?")[1]);

        expect(parseLens(taskParams)).toEqual(lens);
        expect(parseLens(recordsParams)).toEqual(lens);
        expect(parseLens(timelineParams)).toEqual(lens);

        expect(taskParams.get("focus")).toBe("open");
        expect(recordsParams.get("status")).toBe("missing");
        expect(timelineParams.get("sort")).toBe("updated");
    });

    it("filters scope ids and builds prefetch hrefs for primary surfaces", () => {
        const aspectIds: Array<"work" | "finance" | "personal"> = [
            "work",
            "finance",
            "personal",
        ];
        expect(filterScopeIdsForLens(aspectIds, { scope: "all" })).toEqual(
            aspectIds,
        );
        expect(filterScopeIdsForLens(aspectIds, { scope: "work" })).toEqual([
            "work",
        ]);

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
