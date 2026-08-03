import type { LensWindowPreset } from "@/lib/lens";
import type {
    ScopeCheckCoverageSnapshot,
    ScopeCoverageTimelineStub,
    ScopeCoverageWindow,
} from "./types";

type TimelinePreset = Exclude<LensWindowPreset, "custom"> | "custom";

const WINDOWS_BY_PRESET: Record<TimelinePreset, ScopeCoverageWindow> = {
    "30d": { start: "2026-01-22", end: "2026-02-20" },
    "90d": { start: "2025-11-23", end: "2026-02-20" },
    "180d": { start: "2025-08-25", end: "2026-02-20" },
    custom: { start: "2025-12-15", end: "2026-02-10" },
};

const GAPS_BY_PRESET: Record<TimelinePreset, ScopeCoverageTimelineStub["gaps"]> =
    {
        "30d": [
            {
                start: "2026-01-28",
                end: "2026-01-30",
                days: 3,
                checkIds: ["chk_do_mfa_enforcement", "chk_do_log_retention"],
            },
            {
                start: "2026-02-11",
                end: "2026-02-14",
                days: 4,
                checkIds: ["chk_do_endpoint_monitoring", "chk_do_service_continuity"],
            },
        ],
        "90d": [
            {
                start: "2025-12-02",
                end: "2025-12-07",
                days: 6,
                checkIds: [
                    "chk_do_mfa_enforcement",
                    "chk_do_log_retention",
                    "chk_do_backup_restore",
                ],
            },
            {
                start: "2026-01-04",
                end: "2026-01-08",
                days: 5,
                checkIds: ["chk_do_endpoint_monitoring", "chk_do_service_continuity"],
            },
            {
                start: "2026-02-10",
                end: "2026-02-13",
                days: 4,
                checkIds: ["chk_do_change_authorisation"],
            },
        ],
        "180d": [
            {
                start: "2025-09-03",
                end: "2025-09-09",
                days: 7,
                checkIds: [
                    "chk_do_secret_rotation",
                    "chk_do_mfa_enforcement",
                    "chk_do_backup_restore",
                ],
            },
            {
                start: "2025-10-21",
                end: "2025-10-29",
                days: 9,
                checkIds: [
                    "chk_do_log_retention",
                    "chk_do_endpoint_monitoring",
                    "chk_do_service_continuity",
                ],
            },
            {
                start: "2025-12-27",
                end: "2026-01-02",
                days: 7,
                checkIds: ["chk_do_change_authorisation", "chk_do_vuln_sla"],
            },
            {
                start: "2026-02-05",
                end: "2026-02-11",
                days: 7,
                checkIds: ["chk_do_mfa_enforcement", "chk_do_change_authorisation"],
            },
        ],
        custom: [
            {
                start: "2025-12-20",
                end: "2025-12-23",
                days: 4,
                checkIds: ["chk_do_mfa_enforcement", "chk_do_endpoint_monitoring"],
            },
            {
                start: "2026-01-12",
                end: "2026-01-18",
                days: 7,
                checkIds: [
                    "chk_do_log_retention",
                    "chk_do_change_authorisation",
                    "chk_do_service_continuity",
                ],
            },
        ],
    };

const CHECK_COVERAGE_BY_PRESET: Record<
    TimelinePreset,
    ScopeCheckCoverageSnapshot[]
> = {
    "30d": [
        {
            id: "chk_do_mfa_enforcement",
            name: "MFA Enforcement Reporting",
            gapDays: 3,
            coveredPercent: 90,
        },
        {
            id: "chk_do_endpoint_monitoring",
            name: "Endpoint Monitoring Coverage",
            gapDays: 4,
            coveredPercent: 87,
        },
        {
            id: "chk_do_service_continuity",
            name: "Service Continuity Drill",
            gapDays: 4,
            coveredPercent: 87,
        },
    ],
    "90d": [
        {
            id: "chk_do_mfa_enforcement",
            name: "MFA Enforcement Reporting",
            gapDays: 6,
            coveredPercent: 93,
        },
        {
            id: "chk_do_endpoint_monitoring",
            name: "Endpoint Monitoring Coverage",
            gapDays: 9,
            coveredPercent: 90,
        },
        {
            id: "chk_do_change_authorisation",
            name: "Production Change Authorisation",
            gapDays: 4,
            coveredPercent: 96,
        },
        {
            id: "chk_do_service_continuity",
            name: "Service Continuity Drill",
            gapDays: 5,
            coveredPercent: 94,
        },
    ],
    "180d": [
        {
            id: "chk_do_secret_rotation",
            name: "Secret Rotation Operations",
            gapDays: 7,
            coveredPercent: 96,
        },
        {
            id: "chk_do_log_retention",
            name: "Log Retention Review",
            gapDays: 9,
            coveredPercent: 95,
        },
        {
            id: "chk_do_endpoint_monitoring",
            name: "Endpoint Monitoring Coverage",
            gapDays: 9,
            coveredPercent: 95,
        },
        {
            id: "chk_do_change_authorisation",
            name: "Production Change Authorisation",
            gapDays: 14,
            coveredPercent: 92,
        },
        {
            id: "chk_do_vuln_sla",
            name: "Vulnerability SLA Reporting",
            gapDays: 7,
            coveredPercent: 96,
        },
    ],
    custom: [
        {
            id: "chk_do_mfa_enforcement",
            name: "MFA Enforcement Reporting",
            gapDays: 4,
            coveredPercent: 93,
        },
        {
            id: "chk_do_log_retention",
            name: "Log Retention Review",
            gapDays: 7,
            coveredPercent: 88,
        },
        {
            id: "chk_do_change_authorisation",
            name: "Production Change Authorisation",
            gapDays: 7,
            coveredPercent: 88,
        },
        {
            id: "chk_do_service_continuity",
            name: "Service Continuity Drill",
            gapDays: 7,
            coveredPercent: 88,
        },
    ],
};

export function getScopeCoverageTimelineStub(
    windowPreset: LensWindowPreset,
): ScopeCoverageTimelineStub {
    const preset: TimelinePreset =
        windowPreset === "custom" ? "custom" : windowPreset;

    return {
        window: WINDOWS_BY_PRESET[preset],
        gaps: GAPS_BY_PRESET[preset],
        checkCoverage: CHECK_COVERAGE_BY_PRESET[preset],
    };
}
