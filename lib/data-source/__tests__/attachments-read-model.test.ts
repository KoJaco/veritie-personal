import type { AttachmentDetailStub, AttachmentStub } from "@/lib/stubs";
import {
    applyAttachmentIndexFilters,
    mapAttachmentDetailStubToReadModel,
    mapAttachmentIndexFiltersToStub,
    mapAttachmentStubToIndexItem,
    summarizeAttachmentsIndex,
} from "@/lib/data-source/attachments-read-model";

const baseAttachmentStub: AttachmentStub = {
    id: "ev_123",
    filename: "access_review_q1_2026.xlsx",
    fileType: "xlsx",
    attachmentType: "export",
    status: "uploaded",
    linkedTaskId: "task_1",
    linkedTaskTitle: "Complete access review",
    linkedObjectId: undefined,
    linkedObjectTitle: undefined,
    uploadedBy: {
        id: "user_1",
        name: "Kori",
        email: "kori@example.com",
        isMe: true,
    },
    uploadedAt: "2026-03-01T00:00:00.000Z",
    validFrom: "2026-03-01",
    validTo: "2026-06-30",
    source: "manual",
    tags: ["operations-readiness", "access-control"],
    updatedAt: "2026-03-03T00:00:00.000Z",
};

describe("attachment read-model mapping", () => {
    it("maps index item shape from attachment stubs", () => {
        const item = mapAttachmentStubToIndexItem(baseAttachmentStub);

        expect(item).toEqual(
            expect.objectContaining({
                id: "ev_123",
                title: "access review q1 2026",
                kind: "export",
                collectionMethod: "manual",
                status: "active",
                currentVersionNumber: 1,
                validUntil: "2026-06-30",
            }),
        );

        expect(item.relatedTo).toEqual({
            id: "task_1",
            type: "task",
            title: "Complete access review",
        });
    });

    it("maps detail shape including versions, relations, and derived scopes", () => {
        const detailStub: AttachmentDetailStub = {
            ...baseAttachmentStub,
            sizeBytes: 1024,
            summary: "Quarterly access review export.",
            reviewDecision: undefined,
            linkedChecks: [
                {
                    id: "chk_1",
                    type: "procedure",
                    title: "CC6.1",
                },
            ],
        };

        const detail = mapAttachmentDetailStubToReadModel(detailStub);

        expect(detail.id).toBe("ev_123");
        expect(detail.currentVersion.fileName).toBe("access_review_q1_2026.xlsx");
        expect(detail.currentVersion.mimeType).toContain("spreadsheetml");
        expect(detail.currentVersion.status).toBe("approved");
        expect(detail.versions).toHaveLength(3);
        expect(detail.attachedTasks).toHaveLength(1);
        expect(detail.derivedChecks).toEqual([{ id: "chk_1", title: "CC6.1" }]);
        expect(detail.derivedScopes).toEqual([]);
    });

    it("maps branch-13 filters into existing stub filter contract", () => {
        expect(
            mapAttachmentIndexFiltersToStub({
                status: ["draft", "active"],
                attachedTo: "none",
                expiry: "expiring",
                kind: ["screenshot"],
            }),
        ).toEqual(
            expect.objectContaining({
                linked: "unlinked",
                dateRange: "30",
                status: expect.arrayContaining([
                    "requested",
                    "needs_review",
                    "rejected",
                    "uploaded",
                    "accepted",
                ]),
            }),
        );
    });

    it("summarizes index metrics from mapped items", () => {
        const summary = summarizeAttachmentsIndex([
            {
                id: "a",
                title: "A",
                kind: "policy",
                collectionMethod: "manual",
                status: "active",
                currentVersionNumber: 1,
                updatedAt: "2026-03-01T00:00:00.000Z",
                validUntil: "2099-03-01",
            },
            {
                id: "b",
                title: "B",
                kind: "report",
                collectionMethod: "integration",
                status: "draft",
                currentVersionNumber: 1,
                updatedAt: "2026-03-01T00:00:00.000Z",
            },
        ]);

        expect(summary.totalAttachments).toBe(2);
        expect(summary.activeAttachments).toBe(1);
        expect(summary.needsReview).toBe(1);
    });

    it("filters mapped items by attachment kind", () => {
        const filtered = applyAttachmentIndexFilters(
            [
                {
                    id: "a",
                    title: "Policy artifact",
                    kind: "policy",
                    collectionMethod: "manual",
                    status: "active",
                    currentVersionNumber: 1,
                    updatedAt: "2026-03-01T00:00:00.000Z",
                },
                {
                    id: "b",
                    title: "Screenshot artifact",
                    kind: "screenshot",
                    collectionMethod: "manual",
                    status: "active",
                    currentVersionNumber: 1,
                    updatedAt: "2026-03-02T00:00:00.000Z",
                },
            ],
            { kind: ["policy"] },
        );

        expect(filtered).toHaveLength(1);
        expect(filtered[0]?.kind).toBe("policy");
    });
});
