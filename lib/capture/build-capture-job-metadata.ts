import { normalizeCaptureLocationLabel } from "@/lib/capture/capture-context-schema";

export type BuildCaptureJobMetadataInput = {
    capturedAt: string;
    timezone?: string | null;
    locale?: string | null;
    locationLabel?: string | null;
    locationLabelOverride?: string | null;
};

export type CaptureJobMetadata = {
    captured_at: string;
    timezone: string;
    locale: string;
    location_label?: string;
};

export function resolveCaptureTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
        return "UTC";
    }
}

export function resolveCaptureLocale(): string {
    if (typeof navigator !== "undefined" && navigator.language) {
        return navigator.language;
    }
    return "en";
}

export function buildCaptureJobMetadata(
    input: BuildCaptureJobMetadataInput,
): CaptureJobMetadata {
    const locationLabel =
        normalizeCaptureLocationLabel(input.locationLabelOverride) ??
        normalizeCaptureLocationLabel(input.locationLabel);

    const metadata: CaptureJobMetadata = {
        captured_at: input.capturedAt,
        timezone: input.timezone?.trim() || resolveCaptureTimezone(),
        locale: input.locale?.trim() || resolveCaptureLocale(),
    };

    if (locationLabel) {
        metadata.location_label = locationLabel;
    }

    return metadata;
}
