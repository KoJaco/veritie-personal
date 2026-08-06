import { describe, expect, it } from "@jest/globals";

import { backendDataSourceAdapters } from "../backend-adapter";

describe("backendDataSourceAdapters deferred domains", () => {
    it("returns empty objects index without throwing", () => {
        const index = backendDataSourceAdapters.objects.getObjectsIndex();
        expect(index.items).toEqual([]);
        expect(index.availableDomains).toEqual([]);
    });

    it("returns placeholder object detail without throwing", () => {
        const detail = backendDataSourceAdapters.objects.getObjectDetail("doc_1");
        expect(detail.id).toBe("doc_1");
        expect(detail.linkedAttachments).toEqual([]);
    });

    it("returns empty attachments index without throwing", () => {
        const index = backendDataSourceAdapters.attachments.getAttachmentsIndex();
        expect(index.items).toEqual([]);
    });

    it("returns empty dashboard data without throwing", () => {
        expect(backendDataSourceAdapters.dashboard.getTasks(5)).toEqual([]);
        expect(backendDataSourceAdapters.dashboard.getWorkDashboard().nextActions).toEqual(
            [],
        );
    });

    it("throws for deferred attachment upload mutation", () => {
        expect(() =>
            backendDataSourceAdapters.attachments.uploadAttachmentVersion({
                attachmentId: "att_1",
                fileName: "file.pdf",
            }),
        ).toThrow(/not implemented/i);
    });
});
