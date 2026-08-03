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
                description:
                    "Workspace admin settings and framework configuration state.",
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
                visible: settings.team.slice(0, 12).map((member) => ({
                    kind: "team_member",
                    id: member.id,
                    title: member.name,
                    summary: member.role,
                })),
            },
            sections: [
                {
                    key: "workspace_admin",
                    title: "Workspace Admin",
                    kind: "settings_admin",
                    items: [
                        {
                            kind: "team",
                            id: "team_members",
                            summary: String(settings.team.length),
                        },
                        {
                            kind: "capability",
                            id: "capabilities",
                            summary: String(settings.capabilities.length),
                        },
                    ],
                },
                {
                    key: "framework_configuration",
                    title: "Scope Mapping",
                    kind: "settings_scope_mapping",
                    items: settings.scopeMapping.topValidationErrors.map(
                        (error) => ({
                            kind: "validation_error",
                            id: error.id,
                            summary: error.title,
                        }),
                    ),
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
                    criteriaSetStatus: settings.scopeMapping.mappingStatus,
                },
            },
        }),
    };
}
