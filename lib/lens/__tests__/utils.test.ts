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
} from "@/lib/lens";
import { LENS_INPUT_HARD_LIMIT_BYTES } from "@/lib/lens/constants";

// ! data shapes will be overridden when we connect to our backend. Tests must be reconstructed.

describe("lens utils", () => {
    it("normalizes malformed and partial lens input safely", () => {
        expect(normalizeLens(null)).toEqual({ scope: "all" });
        expect(normalizeLens(undefined)).toEqual({ scope: "all" });
        expect(normalizeLens({})).toEqual({ scope: "all" });
        expect(normalizeLens({ scope: "operations-readiness" })).toEqual({
            scope: "operations-readiness",
        });
        expect(normalizeLens({ scope: "delivery-observability" })).toEqual({
            scope: "delivery-observability",
        });
        expect(
            normalizeLens({
                framework: "SOC2",
                mode: "TYPE_II",
                window: "custom",
                start: "2026-99-01",
                end: "2026-01-31",
            } as never),
        ).toEqual({
            scope: "delivery-observability",
        });
        expect(
            normalizeLens({
                framework: "E8",
                mode: "TYPE_II",
                window: "custom",
            } as never),
        ).toEqual({ scope: "workspace-resilience" });
    });

    it("parses query params and degrades unknown values to all", () => {
        expect(
            parseLens(
                new URLSearchParams(
                    "framework=SOC2&mode=TYPE_II&window=custom&start=2026-01-01&end=2026-01-31",
                ),
            ),
        ).toEqual({
            scope: "delivery-observability",
        });

        expect(
            parseLens(new URLSearchParams("scope=NOPEI")),
        ).toEqual({ scope: "all" });

        expect(
            parseLens({
                framework: "SOC2",
                mode: "TYPE_I",
                window: "90d",
            }),
        ).toEqual({
            scope: "operations-readiness",
        });

        expect(
            parseLens(
                new URLSearchParams(
                    "framework=SOC2&mode=TYPE_II&window=custom&start=bad&end=2026-01-31",
                ),
            ),
        ).toEqual({
            scope: "delivery-observability",
        });
    });

    it("returns parse issues for malformed lens params without leaking raw values", () => {
        const result = parseLensResult(
            new URLSearchParams(
                "scope=NOPE&mode=BAD&window=custom&start=bad&end=2026-13-33",
            ),
        );

        expect(result.lens).toEqual({ scope: "all" });
        expect(result.inputSizeBytes).toBeGreaterThan(0);
        expect(result.issues).toEqual(
            expect.arrayContaining([
                "INVALID_SCOPE",
            ]),
        );
    });

    it("rejects oversized lens input and fails closed to default lens", () => {
        const oversized = "x".repeat(LENS_INPUT_HARD_LIMIT_BYTES + 32);
        const result = getLensParseResultFromSearchParams(
            new URLSearchParams(
                `scope=${oversized}`,
            ),
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
            scope: [oversizedValue, oversizedValue],
        });

        expect(result.issues).toContain("OVERSIZED_INPUT");
        expect(result.lens).toEqual({ scope: "all" });
    });

    it("normalizes legacy custom date ranges to the matching scope", () => {
        const result = parseLensResult(
            new URLSearchParams(
                "framework=SOC2&mode=TYPE_II&window=custom&start=2026-03-31&end=2026-01-01",
            ),
        );

        expect(result.issues).toContain("INVALID_FRAMEWORK");
        expect(result.lens).toEqual({ scope: "delivery-observability" });
    });

    it("serializes deterministic canonical scope params", () => {
        const params = serializeLens({
            scope: "delivery-observability",
        });

        expect(params.toString()).toBe("scope=delivery-observability");

        expect(serializeLens({ scope: "workspace-resilience" }).toString()).toBe(
            "scope=workspace-resilience",
        );
        expect(serializeLens({ scope: "knowledge-hygiene" }).toString()).toBe(
            "scope=knowledge-hygiene",
        );
        expect(serializeLens({ scope: "all" }).toString()).toBe(
            "scope=all",
        );
        expect(
            serializeLens({ scope: "operations-readiness" }).toString(),
        ).toBe("scope=operations-readiness");
    });

    it("normalizes legacy inputs before serialization", () => {
        expect(
            serializeLens({
                framework: "SOC2",
                mode: "TYPE_II",
                window: "custom",
                start: "bad-date",
                end: "2026-01-31",
            } as never).toString(),
        ).toBe("scope=delivery-observability");

        expect(
            serializeLens({
                framework: "SOC2",
                mode: "TYPE_II",
                window: "custom",
                start: "2026-03-01",
                end: "2026-01-31",
            } as never).toString(),
        ).toBe("scope=delivery-observability");
    });

    it("applies and preserves lens in relative and absolute hrefs", () => {
        const relative = withLens("/work/tasks?focus=open", {
            scope: "operations-readiness",
        });
        expect(relative).toContain("/work/tasks?");
        expect(relative).toContain("focus=open");
        expect(relative).toContain("scope=operations-readiness");
        expect(relative).not.toContain("mode=TYPE_I");

        const absolute = withLens(
            "https://example.com/work/documents?status=missing",
            {
                scope: "workspace-resilience",
            },
        );
        expect(absolute).toContain("https://example.com/work/documents?");
        expect(absolute).toContain("status=missing");
        expect(absolute).toContain("scope=workspace-resilience");

        const withExtras = withLens(
            "/work/tasks?focus=open",
            { scope: "delivery-observability" },
            { focus: "blocked", status: "overdue", removeMe: null },
        );
        expect(withExtras).toContain("scope=delivery-observability");
        expect(withExtras).not.toContain("mode=TYPE_II");
        expect(withExtras).not.toContain("window=90d");
        expect(withExtras).toContain("focus=blocked");
        expect(withExtras).toContain("status=overdue");
        expect(withExtras).not.toContain("removeMe=");
    });

    it("removes lens params cleanly and maps scope keys", () => {
        const href = withoutLens(
            "/work/tasks?scope=SOC2I&window=90d&foo=bar",
        );
        expect(href).toBe("/work/tasks?foo=bar");

        expect(
            scopeKeyFromLens({ scope: "operations-readiness" }),
        ).toBe("operations-readiness");
        expect(
            scopeKeyFromLens({ scope: "delivery-observability" }),
        ).toBe("delivery-observability");
        expect(scopeKeyFromLens({ scope: "workspace-resilience" })).toBe("workspace-resilience");
        expect(scopeKeyFromLens({ scope: "knowledge-hygiene" })).toBe(
            "knowledge-hygiene",
        );
        expect(scopeKeyFromLens({ scope: "all" })).toBeNull();
    });

    it("covers stripLensParams, mergeParams, getLensFromSearchParams, and isSoc2TypeII", () => {
        const stripped = stripLensParams(
            new URLSearchParams(
                "scope=SOC2I&window=180d&foo=bar&start=2026-01-01&end=2026-01-31",
            ),
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
            getLensFromSearchParams(
                new URLSearchParams("framework=SOC2&mode=TYPE_II&window=30d"),
            ),
        ).toEqual({
            scope: "delivery-observability",
        });

        expect(isSoc2TypeII({ scope: "delivery-observability" })).toBe(true);
        expect(isSoc2TypeII({ scope: "operations-readiness" })).toBe(false);
        expect(isSoc2TypeII({ scope: "workspace-resilience" })).toBe(false);
    });

    it("preserves lens query state across dashboard route transitions", () => {
        const lens = {
            scope: "delivery-observability" as const,
        };

        const taskHref = withLens("/work/tasks?focus=open", lens);
        const documentsHref = withLens(
            "/work/documents?status=missing",
            lens,
        );
        const objectsHref = withLens("/work/documents?sort=updated", lens);

        const taskParams = new URLSearchParams(taskHref.split("?")[1]);
        const documentsParams = new URLSearchParams(documentsHref.split("?")[1]);
        const objectsParams = new URLSearchParams(objectsHref.split("?")[1]);

        expect(parseLens(taskParams)).toEqual(lens);
        expect(parseLens(documentsParams)).toEqual(lens);
        expect(parseLens(objectsParams)).toEqual(lens);

        expect(taskParams.get("focus")).toBe("open");
        expect(documentsParams.get("status")).toBe("missing");
        expect(objectsParams.get("sort")).toBe("updated");
    });
});
