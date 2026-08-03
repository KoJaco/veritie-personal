import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { TaskAttachmentsSection } from "@/components/attachments/TaskAttachmentsSection";
import { AttachmentUploadFlow } from "@/components/attachments/AttachmentUploadFlow";
import { PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { getLensFromSearchParams, type SearchParamRecord } from "@/lib/lens";
import { logger } from "@/lib/logging/server-logger";
import { buildFreshTaskDetail } from "@/lib/onboarding-stub";
import { getStubServerBootstrap } from "@/lib/onboarding-stub/server";
import { TaskActivitySection } from "../_components/TaskActivitySection";
import { TaskResourcesSection } from "../_components/TaskResourcesSection";
import { TaskDocumentsSection } from "../_components/TaskDocumentsSection";
import { TaskHeaderActions } from "../_components/TaskHeader";
import { TaskOverview } from "../_components/TaskOverview";
import { buildFreshTasksRouteContract } from "../_page-model/build";
import { enforceTasksRouteContract } from "../_page-model/validate";

interface TaskPageProps {
    params: Promise<{ taskId: string }>;
    searchParams: Promise<SearchParamRecord>;
}

export default async function TaskPage({
    params,
    searchParams,
}: TaskPageProps) {
    const bootstrap = await getStubServerBootstrap();
    const { taskId } = await params;
    const lens = getLensFromSearchParams(await searchParams);
    const task = buildFreshTaskDetail(bootstrap.summary, taskId, lens);

    const contract = buildFreshTasksRouteContract({
        scope: "task_detail",
        lens,
        taskDetail: task,
        summary: bootstrap.summary,
    });
    const { pageModelValidation, payload } =
        enforceTasksRouteContract(contract);

    logger.debug("[page-model] validation", {
        route: "/work/tasks/[taskId]",
        ok: pageModelValidation.ok,
        sizeBytes: pageModelValidation.sizeBytes,
    });
    if (!pageModelValidation.ok) {
        logger.error("[page-model] validation_failed", {
            route: "/work/tasks/[taskId]",
            errorCode: pageModelValidation.errorCode,
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes ?? null,
        });
    } else if (pageModelValidation.reason) {
        logger.warn("[page-model] payload_soft_limit_exceeded", {
            route: "/work/tasks/[taskId]",
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
                        title={task.title}
                        description="Your setup work, prioritised"
                        separator={false}
                        actions={<TaskHeaderActions task={task} />}
                    />
                }
            >
                <div className="space-y-12 py-6">
                    <TaskOverview task={task} />
                    <TaskAttachmentsSection
                        taskId={task.id}
                        taskTitle={task.title}
                        lens={lens}
                        items={task.attachments}
                        emptyStateDescription="This setup task does not require attachments yet. Capture the baseline workflow first, then attach supporting material as the workspace matures."
                        actions={
                            <AttachmentUploadFlow
                                context={{
                                    kind: "task",
                                    taskId: task.id,
                                    taskTitle: task.title,
                                }}
                                triggerLabel="Upload attachment"
                                triggerVariant="outline"
                            />
                        }
                    />
                    <TaskDocumentsSection
                        lens={lens}
                        documents={task.documents}
                    />
                    <TaskResourcesSection
                        lens={lens}
                        resource={task.resourceDetail}
                    />
                    <TaskActivitySection items={task.activity} />
                </div>
            </PageFrame>
        </>
    );
}
