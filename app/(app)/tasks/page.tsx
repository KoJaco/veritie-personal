import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { EmptyState, PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { TasksPageHeaderActions } from "./_components/TasksPageHeaderActions";
import {
    type TaskIndexSegment,
    type TaskUiStatus,
    getDataSourceAdapters,
    getDataSourceKind,
    type TasksIndexQuery,
} from "@/lib/data-source";
import { getLensFromSearchParams, type SearchParamRecord } from "@/lib/lens";
import { logger } from "@/lib/logging/server-logger";
import { buildFreshTasksIndex } from "@/lib/onboarding-stub";
import { getStubServerBootstrap } from "@/lib/onboarding-stub/server";
import { ListTodo } from "lucide-react";
import {
    buildFreshTasksRouteContract,
    buildTasksRouteContract,
} from "./_page-model/build";
import { enforceTasksRouteContract } from "./_page-model/validate";

interface TasksPageProps {
    searchParams: Promise<SearchParamRecord>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
    const resolvedSearchParams = await searchParams;
    const lens = getLensFromSearchParams(resolvedSearchParams);
    const segment = parseSegment(getStringValue(resolvedSearchParams.segment));
    const statuses = parseStatusValues(resolvedSearchParams.status);
    const ownerIds = getStringValues(resolvedSearchParams.owner);
    const checkIds = getStringValues(resolvedSearchParams.check);
    const resourceIds = getStringValues(resolvedSearchParams.resource);

    const query: TasksIndexQuery = {
        segment,
        lens,
        statuses: statuses.length > 0 ? statuses : undefined,
        ownerIds: ownerIds.length > 0 ? ownerIds : undefined,
        checkIds: checkIds.length > 0 ? checkIds : undefined,
        resourceIds: resourceIds.length > 0 ? resourceIds : undefined,
    };

    const dataSourceKind = getDataSourceKind();
    let tasksIndex;
    let contract;

    if (dataSourceKind === "stub") {
        const bootstrap = await getStubServerBootstrap();
        tasksIndex = buildFreshTasksIndex(bootstrap.summary, lens, query);
        contract = buildFreshTasksRouteContract({
            scope: "tasks_index",
            lens,
            tasksIndex,
            summary: bootstrap.summary,
        });
    } else {
        tasksIndex = await getDataSourceAdapters().tasks.getTasksIndex(query);
        contract = buildTasksRouteContract({
            scope: "tasks_index",
            lens,
            tasksIndex,
        });
    }

    const ownerOptions = tasksIndex.availableOwners;
    const checkOptions = tasksIndex.availableChecks.map((check) => ({
        id: check.id,
        label: check.title,
    }));
    const resourceOptions = tasksIndex.availableResources.map((resource) => ({
        id: resource.id,
        label: resource.name,
    }));
    const createTaskDialogProps = {
        checks: checkOptions,
        owners: ownerOptions.map((owner) => ({
            id: owner.id,
            label: owner.name,
        })),
        resources: resourceOptions,
    };

    const { pageModelValidation, payload } =
        enforceTasksRouteContract(contract);

    logger.debug("[page-model] validation", {
        route: "/tasks",
        ok: pageModelValidation.ok,
        sizeBytes: pageModelValidation.sizeBytes,
    });
    if (!pageModelValidation.ok) {
        logger.error("[page-model] validation_failed", {
            route: "/tasks",
            errorCode: pageModelValidation.errorCode,
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes ?? null,
        });
    } else if (pageModelValidation.reason) {
        logger.warn("[page-model] payload_soft_limit_exceeded", {
            route: "/tasks",
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes,
        });
    }

    return (
        <>
            <ContextPayloadSlot payload={payload} />
            <PageFrame
                header={
                    <PageHeader
                        title="Tasks"
                        description="Your setup work, prioritised"
                        separator={false}
                        actions={
                            <TasksPageHeaderActions
                                canOpenAssistant={
                                    contract.pageModel.actions.available.includes(
                                        "assistant/open",
                                    )
                                }
                                createTaskDialogProps={createTaskDialogProps}
                            />
                        }
                    />
                }
            >
                <EmptyState
                    title="Tasks coming soon"
                    description="Your prioritised work queue, filters, and setup tasks will appear here."
                    icon={<ListTodo className="h-10 w-10" />}
                />

                {/*
                <div className="space-y-12 py-6">
                    <div className="space-y-3 ">
                        <div className="flex gap-3 flex-row items-end">
                            <div
                                aria-label="Applied filters"
                                className="min-w-0 flex-1 space-y-2"
                            >
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                    <p className="font-medium text-muted-foreground">
                                        Applied filters
                                    </p>
                                    <span className="text-muted-foreground/60">
                                        {tasksIndex.items.length}{" "}
                                        {tasksIndex.items.length === 1
                                            ? "task"
                                            : "tasks"}
                                    </span>
                                </div>
                                <ScrollArea className="w-full whitespace-nowrap rounded-md pb-2">
                                    <div className="flex w-max items-center gap-2 pb-1">
                                        {appliedFilters.map((filter) => {
                                            return (
                                                <Badge
                                                    key={`${filter.key}:${filter.value}`}
                                                    variant="outline"
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 border-border/70 bg-background/80 px-3 py-1.5 text-foreground",
                                                        filter.key.toLocaleLowerCase() !==
                                                        "view" &&
                                                        "md:inline-flex hidden",
                                                    )}
                                                >
                                                    <filter.icon className="h-3.5 w-3.5 text-foreground/75" />
                                                    <span className="text-foreground/75">
                                                        {filter.key}:
                                                    </span>
                                                    {filter.value}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                    <ScrollBar
                                        orientation="horizontal"
                                        className="mt-1.5"
                                    />
                                </ScrollArea>
                            </div>

                            <div className="pb-3 ml-6">
                                <TaskFilterToolbar
                                    lens={lens}
                                    initialSegment={segment}
                                    initialStatuses={statuses}
                                    initialOwnerIds={ownerIds}
                                    initialCheckIds={checkIds}
                                    initialResourceIds={resourceIds}
                                    ownerOptions={ownerOptions}
                                    checkOptions={checkOptions}
                                    resourceOptions={resourceOptions}
                                    currentParams={{
                                        status:
                                            statuses.length > 0
                                                ? statuses
                                                : null,
                                        owner:
                                            ownerIds.length > 0
                                                ? ownerIds
                                                : null,
                                        check:
                                            checkIds.length > 0
                                                ? checkIds
                                                : null,
                                        resource:
                                            resourceIds.length > 0
                                                ? resourceIds
                                                : null,
                                    }}
                                    summary={tasksIndex.summary}
                                />
                            </div>
                        </div>
                        <TaskList
                            lens={lens}
                            items={tasksIndex.items}
                            hasFilters={hasFilters}
                            emptyStateAction={
                                <CreateTaskDialog {...createTaskDialogProps} />
                            }
                        />
                    </div>
                </div>
                */}
            </PageFrame>
        </>
    );
}

function parseSegment(value: string | null): TaskIndexSegment {
    if (value === "mine" || value === "dueSoon" || value === "overdue") {
        return value;
    }

    return "all";
}

function parseStatusValues(
    value: string | string[] | undefined,
): TaskUiStatus[] {
    const values = getStringValues(value);

    return values.filter(
        (item): item is TaskUiStatus =>
            item === "open" ||
            item === "in_progress" ||
            item === "blocked" ||
            item === "completed",
    );
}

function getStringValue(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value ?? null;
}

function getStringValues(value: string | string[] | undefined): string[] {
    const values = Array.isArray(value) ? value : value ? [value] : [];

    return Array.from(
        new Set(
            values.map((item) => item.trim()).filter((item) => item.length > 0),
        ),
    );
}
