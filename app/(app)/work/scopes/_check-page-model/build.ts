import { buildRailPayload } from "@/components/context/build-rail-payload";
import type { RailContextPayload } from "@/components/context/types";
import type { CheckDetailReadModel, CheckScope } from "@/lib/data-source";
import { checkScopeLabel } from "@/lib/data-source";
import type { ScopeLens } from "@/lib/lens";
import type { PageModel } from "@/lib/page-model/types";

export type CheckRouteContract = {
    pageModel: PageModel;
    railPayloadCandidate: RailContextPayload | null;
    checkScope: CheckScope;
};

type BuildCheckDetailPageModelParams = {
    lens: ScopeLens;
    checkScope: CheckScope;
    check: CheckDetailReadModel;
};

export function buildCheckDetailPageModel({
    lens,
    checkScope,
    check,
}: BuildCheckDetailPageModelParams): PageModel {
    return {
        meta: {
            title: check.title,
            description: check.description,
            breadcrumbs: [
                { label: "Work", href: "/work" },
                { label: "Scopes", href: "/work/scopes" },
                { label: checkScopeLabel(checkScope) },
                { label: check.title },
            ],
            scope: { scopeId: lens.scope },
        },
        view: {
            key: "scope_check_detail",
            featureFlags: {
                hasScopeLens: lens.scope !== "all",
            },
        },
        refs: {
            primary: {
                kind: "check",
                id: check.id,
                title: check.title,
                summary: check.readiness,
            },
            visible: [
                ...check.relatedAttachments.map((item) => ({
                    kind: "attachment",
                    id: item.id,
                    title: item.title,
                    summary: `v${item.currentVersionNumber}`,
                })),
                ...check.relatedTasks.map((item) => ({
                    kind: "task",
                    id: item.id,
                    title: item.title,
                    summary: item.status,
                })),
            ],
        },
        sections: [
            {
                key: "check_readiness",
                title: "Readiness",
                kind: "check_readiness",
                dataRef: { kind: "check", id: check.id },
            },
            {
                key: "check_attachments",
                title: "Related Attachments",
                kind: "relations_list",
                items: check.relatedAttachments.map((item) => ({
                    kind: "attachment",
                    id: item.id,
                    summary: item.title,
                })),
            },
            {
                key: "check_tasks",
                title: "Related Tasks",
                kind: "relations_list",
                items: check.relatedTasks.map((item) => ({
                    kind: "task",
                    id: item.id,
                    summary: item.title,
                })),
            },
        ],
        capabilities: {
            canUseContextRail: true,
            canOpenLensDialog: true,
        },
        actions: {
            available: ["work/openScopeDialog", "context/toggleRail"],
        },
    };
}

export function buildCheckRouteContract({
    lens,
    checkScope,
    check,
}: BuildCheckDetailPageModelParams): CheckRouteContract {
    return {
        pageModel: buildCheckDetailPageModel({
            lens,
            checkScope,
            check,
        }),
        checkScope,
        railPayloadCandidate: buildRailPayload({
            scope: { type: "scope_check_detail", id: check.id },
            primaryObject: { type: "check", id: check.id },
            lens,
            aggregates: {
                snapshot: {
                    blockedChecks: check.readiness === "blocked" ? 1 : 0,
                    overdueTasks: check.relatedTasks.filter(
                        (task) => task.status === "blocked",
                    ).length,
                    missingAttachments: check.missingAttachmentCount,
                    tasksInScope: check.linkedTasksCount,
                },
            },
        }),
    };
}
