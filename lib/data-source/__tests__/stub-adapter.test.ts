import { stubDataSourceAdapters } from "@/lib/data-source/stub-adapter";
import { resetStubAttachmentStoreForTests } from "@/lib/data-source/stub-attachment-store";
import { resetStubObjectStoreForTests } from "@/lib/data-source/stub-object-store";
import { resetStubResourceStoreForTests } from "@/lib/data-source/stub-resource-store";
import { resetStubTaskStoreForTests } from "@/lib/data-source/stub-task-store";
import { resetCaptureStubStoreForTests } from "@/lib/stubs/capture-stubs";
import { resetTimelineStubStoreForTests } from "@/lib/stubs/timeline-stubs";

describe("stub data-source adapter", () => {
    beforeEach(() => {
        resetStubResourceStoreForTests();
        resetStubAttachmentStoreForTests();
        resetStubObjectStoreForTests();
        resetStubTaskStoreForTests();
        resetCaptureStubStoreForTests();
        resetTimelineStubStoreForTests();
    });

    it("returns dashboard source data with expected shape", () => {
        const tasks = stubDataSourceAdapters.dashboard.getTasks(5);
        const dashboard = stubDataSourceAdapters.dashboard.getWorkDashboard();
        const summaries = stubDataSourceAdapters.dashboard.getTaskSummaries(
            tasks,
            new Date(),
        );

        expect(tasks).toHaveLength(5);
        expect(tasks[0]?.id).toBe("task-iso-gap-remediation");
        expect(Array.isArray(dashboard.recentActivity)).toBe(true);
        expect(dashboard.activeWorkstreams[0]?.name).toBe("Access governance");
        expect(summaries).toHaveLength(tasks.length);
    });

    it("keeps dashboard references aligned to existing task, object, attachment, and resource routes", async () => {
        const tasks = stubDataSourceAdapters.dashboard.getTasks(32);
        const dashboard = stubDataSourceAdapters.dashboard.getWorkDashboard();
        const taskIds = new Set(tasks.map((task) => task.id));

        expect(taskIds).toEqual(
            new Set([
                "task-iso-gap-remediation",
                "task-attachment-coverage-reconciliation",
                "task-access-provisioning-validation",
                "task-remediation-program",
                "task-config-hardening-review",
                "task-ac-policy-review",
            ]),
        );

        for (const activity of dashboard.recentActivity) {
            if (activity.target.type === "task") {
                await expect(
                    stubDataSourceAdapters.tasks.getTaskDetail(activity.target.id),
                ).resolves.toBeDefined();
            }

            if (activity.target.type === "object") {
                expect(() =>
                    stubDataSourceAdapters.objects.getObjectDetail(activity.target.id),
                ).not.toThrow();
            }

            if (activity.target.type === "attachment") {
                expect(() =>
                    stubDataSourceAdapters.attachments.getAttachmentDetail(
                        activity.target.id,
                    ),
                ).not.toThrow();
            }
        }

        await expect(
            stubDataSourceAdapters.resources.getResourceDetail("resource_seed_3"),
        ).resolves.toBeDefined();
        expect(() =>
            stubDataSourceAdapters.checks.getCheckDetail(
                { scopeId: "work" },
                "check-narrative",
            ),
        ).not.toThrow();
        expect(() =>
            stubDataSourceAdapters.checks.getCheckDetail(
                { scopeId: "personal" },
                "config-snippet",
            ),
        ).not.toThrow();
    });

    it("returns object and settings payloads via adapter methods", async () => {
        const objects = stubDataSourceAdapters.objects.getObjectsIndex(3);
        const objectDetail = stubDataSourceAdapters.objects.getObjectDetail(
            objects[0]!.id,
        );
        const connections =
            stubDataSourceAdapters.connections.getConnectionsIndex();
        const connectionDetail =
            stubDataSourceAdapters.connections.getConnectionDetail("conn_azure_ad");
        const settings = await stubDataSourceAdapters.settings.getSettings();

        expect(objects).toHaveLength(3);
        expect(objectDetail.id).toBeTruthy();
        expect(connections.connected.length).toBeGreaterThan(0);
        expect(connections.providerOptions.length).toBeGreaterThan(0);
        expect(connections.disconnected.length).toBeGreaterThan(0);
        expect(connectionDetail.generatedAttachments.length).toBeGreaterThan(0);
        expect(settings.scopeMapping.mappingStatus).toMatch(/valid|invalid/);
        expect(settings.frameworkConfiguration.soc2.mappingStatus).toMatch(
            /valid|invalid/,
        );
    });

    it("fails closed for disconnected providers when requesting detail", () => {
        expect(() =>
            stubDataSourceAdapters.connections.getConnectionDetail("conn_jira"),
        ).toThrow(/not inspectable/i);
    });

    it("returns resource index/detail data and supports create", async () => {
        const resources = await stubDataSourceAdapters.resources.getResourcesIndex(3);
        const detail = await stubDataSourceAdapters.resources.getResourceDetail(
            resources[0]!.id,
        );
        const created = await stubDataSourceAdapters.resources.createResource({
            name: "Knowledge Base",
            category: "resource",
            ownerName: "Avery Lee",
            criticality: "medium",
            sensitivity: "internal",
        });
        const createdDetail = await stubDataSourceAdapters.resources.getResourceDetail(
            created.resourceId,
        );

        expect(resources).toHaveLength(3);
        expect(detail.id).toBeTruthy();
        expect(detail.linkedChecks.length).toBeGreaterThan(0);
        expect(createdDetail.name).toBe("Knowledge Base");
        expect(createdDetail.timeline[0]?.type).toBe("created");
        expect(createdDetail.scopeIds).toEqual([]);
        expect(createdDetail.coverageFlags.hasOwner).toBe(true);
        expect(createdDetail.coverageFlags.hasAttachments).toBe(false);
    });

    it("returns branch-13 attachment index/detail read models", () => {
        const attachmentsIndex = stubDataSourceAdapters.attachments.getAttachmentsIndex(6);
        const firstItem = attachmentsIndex.items[0];

        expect(Array.isArray(attachmentsIndex.items)).toBe(true);
        expect(attachmentsIndex.items).toHaveLength(6);
        expect(attachmentsIndex.summary.totalAttachments).toBeGreaterThanOrEqual(
            attachmentsIndex.items.length,
        );

        expect(firstItem).toBeDefined();
        expect(firstItem?.id).toBeTruthy();
        expect(firstItem?.title).toBeTruthy();
        expect(firstItem?.currentVersionNumber).toBeGreaterThanOrEqual(1);
        expect(["draft", "active", "superseded", "archived"]).toContain(
            firstItem?.status,
        );

        const detail = stubDataSourceAdapters.attachments.getAttachmentDetail(
            firstItem!.id,
        );
        expect(detail.currentVersion.versionNumber).toBeGreaterThanOrEqual(1);
        expect(detail.versions.length).toBeGreaterThan(0);
        expect(detail.derivedChecks).toBeDefined();
        expect(detail.derivedScopes).toBeDefined();
    });

    it("keeps the named task, attachment, and object stories aligned", async () => {
        const stories = [
            {
                taskId: "task-ac-policy-review",
                objectId: "policy-access-governance",
                attachmentIds: ["att_policy_packet", "att_versioned"],
            },
            {
                taskId: "task-access-provisioning-validation",
                objectId: "check-narrative",
                attachmentIds: ["att_detail", "att_api_1"],
            },
            {
                taskId: "task-iso-gap-remediation",
                objectId: "gap-analysis-standards",
                attachmentIds: ["att_iso_gap_register"],
            },
            {
                taskId: "task-remediation-program",
                objectId: "remediation-plan-90-days",
                attachmentIds: ["att_remediation_status_pack"],
            },
            {
                taskId: "task-attachment-coverage-reconciliation",
                objectId: "attachment-mapping-summary",
                attachmentIds: ["att_mapping_matrix"],
            },
            {
                taskId: "task-config-hardening-review",
                objectId: "config-snippet",
                attachmentIds: ["att_config_baseline"],
            },
        ] as const;

        for (const story of stories) {
            const task = await stubDataSourceAdapters.tasks.getTaskDetail(story.taskId);
            const object = stubDataSourceAdapters.objects.getObjectDetail(
                story.objectId,
            );

            expect(task.check.id).toBe(story.objectId);
            expect(task.attachments.map((item) => item.id)).toEqual(
                story.attachmentIds,
            );
            expect(object.relatedTaskId).toBe(story.taskId);
            expect(object.linkedAttachments.map((item) => item.id)).toEqual(
                story.attachmentIds,
            );
            expect(task.scopeIds).toEqual(
                expect.arrayContaining(object.scopeIds ?? []),
            );

            for (const attachmentId of story.attachmentIds) {
                const attachment =
                    stubDataSourceAdapters.attachments.getAttachmentDetail(attachmentId);

                expect(attachment.attachedTasks.map((item) => item.id)).toContain(
                    story.taskId,
                );
                expect(attachment.attachedObjects.map((item) => item.id)).toContain(
                    story.objectId,
                );
            expect(attachment.derivedChecks.map((item) => item.id)).toContain(
                story.objectId,
            );
            }
        }
    });

    it("locks core normalization rules for blocked, completed, and overdue named tasks", async () => {
        const blocked = await stubDataSourceAdapters.tasks.getTaskDetail(
            "task-iso-gap-remediation",
        );
        const completed = await stubDataSourceAdapters.tasks.getTaskDetail(
            "task-config-hardening-review",
        );
        const overdue = await stubDataSourceAdapters.tasks.getTaskDetail(
            "task-attachment-coverage-reconciliation",
        );

        expect(blocked.status).toBe("blocked");
        expect(blocked.blockers.length).toBeGreaterThan(0);
        expect(blocked.missingAttachmentCount).toBeGreaterThan(0);

        expect(completed.status).toBe("completed");
        expect(completed.attachments.length).toBeGreaterThan(0);
        expect(
            completed.attachments.every(
                (item) =>
                    item.validUntil === undefined ||
                    Date.parse(item.validUntil) > Date.parse("2026-04-07"),
            ),
        ).toBe(true);

        expect(overdue.status).toBe("open");
        expect(overdue.isOverdue).toBe(true);
    });

    it("keeps the access provisioning story aligned across task, resource, attachment, and check detail", async () => {
        const task = await stubDataSourceAdapters.tasks.getTaskDetail(
            "task-access-provisioning-validation",
        );
        const resource =
            await stubDataSourceAdapters.resources.getResourceDetail("resource_seed_3");
        const attachment = stubDataSourceAdapters.attachments.getAttachmentDetail(
            "att_detail",
        );
        const control = stubDataSourceAdapters.checks.getCheckDetail(
            { scopeId: "work" },
            "check-narrative",
        );

        expect(task.resourceDetail?.id).toBe(resource.id);
        expect(resource.linkedTasks.map((item) => item.id)).toContain(task.id);
        expect(resource.linkedAttachments.map((item) => item.id)).toEqual(
            expect.arrayContaining(["att_detail", "att_versioned"]),
        );
        expect(attachment.attachedTasks[0]?.id).toBe(task.id);
        expect(control.relatedTasks.map((item) => item.id)).toContain(task.id);
        expect(control.relatedAttachments.map((item) => item.id)).toEqual(
            expect.arrayContaining(["att_detail", "att_api_1"]),
        );
    });

    it("uploads new attachment versions against a stable attachment root", () => {
        const before = stubDataSourceAdapters.attachments.getAttachmentDetail("att_versioned");
        const upload = stubDataSourceAdapters.attachments.uploadAttachmentVersion({
            attachmentId: "att_versioned",
            fileName: "att_versioned_v-next.pdf",
            mimeType: "application/pdf",
            sizeBytes: 2048,
            validUntil: "2026-12-31",
        });
        const after = stubDataSourceAdapters.attachments.getAttachmentDetail("att_versioned");
        const indexItem = stubDataSourceAdapters.attachments
            .getAttachmentsIndex(100)
            .items.find((item) => item.id === "att_versioned");

        expect(upload.versionNumber).toBe(before.currentVersion.versionNumber + 1);
        expect(after.id).toBe(before.id);
        expect(after.currentVersion.versionNumber).toBe(upload.versionNumber);
        expect(after.versions[1]?.status).toBe("superseded");
        expect(indexItem?.currentVersionNumber).toBe(upload.versionNumber);
        expect(indexItem?.validUntil).toBe("2026-12-31");
    });

    it("uploads attachment versions through the attachment adapter", () => {
        const before =
            stubDataSourceAdapters.attachments.getAttachmentDetail("att_versioned");
        const upload =
            stubDataSourceAdapters.attachments.uploadAttachmentVersion({
                attachmentId: "att_versioned",
                fileName: "attachment-v-next.pdf",
                mimeType: "application/pdf",
                sizeBytes: 2048,
                validUntil: "2026-12-31",
            });
        const after =
            stubDataSourceAdapters.attachments.getAttachmentDetail("att_versioned");

        expect(upload.versionNumber).toBe(before.currentVersion.versionNumber + 1);
        expect(after.currentVersion.versionNumber).toBe(upload.versionNumber);
    });

    it("returns check inspection read models for scope ids", () => {
        const checks = stubDataSourceAdapters.checks.getChecksForScope(
            { scopeId: "work" },
            6,
        );

        expect(Array.isArray(checks.items)).toBe(true);
        expect(checks.summary.totalChecks).toBe(checks.items.length);

        const firstCheck = checks.items[0];
        expect(firstCheck).toBeDefined();
        expect(firstCheck?.scopeId).toBe("work");
        expect(firstCheck?.scopeLabel).toBe("Work");

        const detail = stubDataSourceAdapters.checks.getCheckDetail(
            { scopeId: "work" },
            firstCheck!.id,
        );

        expect(detail.id).toBe(firstCheck!.id);
        expect(Array.isArray(detail.relatedAttachments)).toBe(true);
        expect(Array.isArray(detail.relatedTasks)).toBe(true);
    });

    it("returns aggregated checks for cross-scope inspection", () => {
        const checks = stubDataSourceAdapters.checks.getAggregatedChecks();

        expect(Array.isArray(checks.items)).toBe(true);
        expect(checks.items).toHaveLength(30);
        expect(checks.summary.totalChecks).toBe(checks.items.length);
        expect(checks.items[0]?.detailHref).toBe("/timeline");
        expect(checks.items.some((item) => item.ownerState === "missing")).toBe(
            true,
        );
        expect(new Set(checks.items.map((item) => item.id)).size).toBe(30);
    });

    it("filters aggregated checks by scope and owner state", () => {
        const checks = stubDataSourceAdapters.checks.getAggregatedChecks({
            scope: "personal",
            ownerState: ["missing"],
        });

        expect(checks.items.length).toBeGreaterThan(0);
        expect(
            checks.items.every(
                (item) =>
                    item.scopeId === "personal" && item.ownerState === "missing",
            ),
        ).toBe(true);
    });

    it("sorts aggregated checks by brokenness", () => {
        const checks = stubDataSourceAdapters.checks.getAggregatedChecks();
        const rank = (value: string) => {
            if (value === "blocked") return 0;
            if (value === "unmapped") return 1;
            if (value === "at_risk") return 2;
            return 3;
        };

        expect(checks.items.length).toBeGreaterThan(1);

        for (let index = 1; index < checks.items.length; index += 1) {
            const previous = checks.items[index - 1];
            const current = checks.items[index];

            expect(rank(current!.readiness)).toBeGreaterThanOrEqual(
                rank(previous!.readiness),
            );
        }
    });

    it("keeps check-related attachment summaries in sync with uploaded versions", () => {
        const checks = stubDataSourceAdapters.checks.getChecksForScope(
            { scopeId: "admin" },
            12,
        );
        const checkWithAttachments = checks.items.find((check) => {
            const detail = stubDataSourceAdapters.checks.getCheckDetail(
                { scopeId: "admin" },
                check.id,
            );

            return detail.relatedAttachments.length > 0;
        });

        if (!checkWithAttachments) {
            return;
        }

        const detailBefore = stubDataSourceAdapters.checks.getCheckDetail(
            { scopeId: "admin" },
            checkWithAttachments.id,
        );
        const relatedAttachments = detailBefore.relatedAttachments[0];

        expect(relatedAttachments).toBeDefined();

        stubDataSourceAdapters.attachments.uploadAttachmentVersion({
            attachmentId: relatedAttachments!.id,
            fileName: "check-linked-attachment-v-next.pdf",
            mimeType: "application/pdf",
            sizeBytes: 1024,
        });

        const detailAfter = stubDataSourceAdapters.checks.getCheckDetail(
            { scopeId: "admin" },
            checkWithAttachments.id,
        );

        const updatedAttachment = detailAfter.relatedAttachments.find(
            (item) => item.id === relatedAttachments!.id,
        );
        expect(updatedAttachment?.currentVersionNumber).toBe(
            relatedAttachments!.currentVersionNumber + 1,
        );
    });
});
