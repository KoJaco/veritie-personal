import { buildRailPayload } from "@/components/context/build-rail-payload";
import type { RailContextPayload } from "@/components/context/types";
import type { ScopeLens } from "@/lib/lens";
import type { PageModel } from "@/lib/page-model/types";
import type { SettingsStub } from "@/lib/stubs";

export type SettingsRouteContract = {
    pageModel: PageModel;
    railPayloadCandidate: RailContextPayload | null;
};

export function buildSettingsRouteContract({
    lens,
    settings,
}: {
    lens: ScopeLens;
    settings: SettingsStub;
}): SettingsRouteContract {
    return {
        pageModel: {
            meta: {
                title: "Settings",
                description: "Account profile, session, and workspace settings.",
                breadcrumbs: [
                    { label: "Work", href: "/timeline" },
                    { label: "Settings" },
                ],
                aspect: { aspectId: lens.scope },
            },
            view: {
                key: "settings",
                featureFlags: {
                    hasScopeFilter: lens.scope !== "all",
                },
            },
            refs: {
                visible: [
                    {
                        kind: "profile",
                        id: settings.profile.email,
                        title: settings.profile.name,
                        summary: settings.profile.role,
                    },
                ],
            },
            sections: [
                {
                    key: "account_profile",
                    title: "Account Profile",
                    kind: "settings_profile",
                    items: [
                        {
                            kind: "profile",
                            id: "account_profile",
                            summary: settings.profile.email,
                        },
                    ],
                },
            ],
            capabilities: {
                canUseContextRail: false,
            },
            actions: {
                available: ["settings/open"],
            },
        },
        railPayloadCandidate: buildRailPayload({
            scope: { type: "settings" },
            lens,
            aggregates: {
                snapshot: {
                    blockedChecks: 0,
                    overdueTasks: 0,
                    missingAttachments: 0,
                    criteriaSetStatus: "valid",
                },
            },
        }),
    };
}
