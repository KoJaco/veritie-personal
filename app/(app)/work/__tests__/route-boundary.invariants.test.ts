import fs from "fs";
import path from "path";
import { getLensFromSearchParams } from "@/lib/lens";

const WORK_ROOT = path.join(process.cwd(), "app", "(app)", "work");

function collectPageFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectPageFiles(fullPath));
            continue;
        }

        if (entry.isFile() && entry.name === "page.tsx") {
            files.push(fullPath);
        }
    }

    return files.sort();
}

function stripComments(source: string): string {
    return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("work page route-boundary invariants", () => {
    it("keeps work page roots server-only and route-hook free", () => {
        const pageFiles = collectPageFiles(WORK_ROOT);
        expect(pageFiles.length).toBeGreaterThan(0);

        const violations: string[] = [];
        // check common client hook patterns
        const hookCallPatterns: Array<{ token: string; pattern: RegExp }> = [
            { token: "usePathname(", pattern: /\busePathname\s*\(/ },
            { token: "useSearchParams(", pattern: /\buseSearchParams\s*\(/ },
            {
                token: "useSelectedLayoutSegment(",
                pattern: /\buseSelectedLayoutSegment\s*\(/,
            },
            {
                token: "useSelectedLayoutSegments(",
                pattern: /\buseSelectedLayoutSegments\s*\(/,
            },
        ];

        for (const filePath of pageFiles) {
            const relative = path.relative(process.cwd(), filePath);
            const source = fs.readFileSync(filePath, "utf8");
            const sanitized = stripComments(source);

            // check use client top

            if (/^\s*["']use client["'];?/m.test(sanitized)) {
                violations.push(
                    `${relative}: found disallowed page-root directive "use client"`,
                );
            }

            for (const hook of hookCallPatterns) {
                if (hook.pattern.test(sanitized)) {
                    violations.push(
                        `${relative}: found disallowed route-hook token ${hook.token}`,
                    );
                }
            }
        }

        if (violations.length > 0) {
            throw new Error(
                `Route-boundary invariant violations detected:\n${violations.join("\n")}`,
            );
        }
    });

    it("degrades invalid legacy framework query input safely at route boundaries", () => {
        const malformedLens = getLensFromSearchParams({
            framework: "BAD_VALUE",
            mode: "NOPE",
            window: "custom",
            start: "invalid-date",
            end: "also-invalid",
        });

        expect(malformedLens).toEqual({ scope: "all" });
    });
});
