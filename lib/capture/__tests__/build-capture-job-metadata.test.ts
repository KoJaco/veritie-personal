import { describe, expect, it } from "@jest/globals";

import {
    buildCaptureJobMetadata,
    resolveCaptureLocale,
    resolveCaptureTimezone,
} from "@/lib/capture/build-capture-job-metadata";

describe("lib/capture/build-capture-job-metadata", () => {
    it("always includes captured_at, timezone, and locale", () => {
        const metadata = buildCaptureJobMetadata({
            capturedAt: "2026-08-06T02:00:00.000Z",
            timezone: "Australia/Sydney",
            locale: "en-AU",
        });

        expect(metadata).toEqual({
            captured_at: "2026-08-06T02:00:00.000Z",
            timezone: "Australia/Sydney",
            locale: "en-AU",
        });
    });

    it("includes location_label when settings provide a value", () => {
        const metadata = buildCaptureJobMetadata({
            capturedAt: "2026-08-06T02:00:00.000Z",
            locationLabel: "North Manly",
        });

        expect(metadata.location_label).toBe("North Manly");
    });

    it("prefers override over settings default", () => {
        const metadata = buildCaptureJobMetadata({
            capturedAt: "2026-08-06T02:00:00.000Z",
            locationLabel: "Home",
            locationLabelOverride: "Bike shop",
        });

        expect(metadata.location_label).toBe("Bike shop");
    });

    it("omits location_label when blank", () => {
        const metadata = buildCaptureJobMetadata({
            capturedAt: "2026-08-06T02:00:00.000Z",
            locationLabel: "   ",
        });

        expect(metadata.location_label).toBeUndefined();
    });

    it("falls back timezone and locale helpers", () => {
        expect(resolveCaptureTimezone()).toBeTruthy();
        expect(resolveCaptureLocale()).toBeTruthy();
    });
});
