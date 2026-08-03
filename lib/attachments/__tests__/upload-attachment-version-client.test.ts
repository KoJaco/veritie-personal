import { uploadAttachmentVersionViaApi } from "@/lib/attachments/upload-attachment-version-client";

describe("uploadAttachmentVersionViaApi", () => {
    beforeEach(() => {
        Object.defineProperty(globalThis, "fetch", {
            writable: true,
            value: jest.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    attachmentId: "att_api_1",
                    versionId: "evver_2",
                    versionNumber: 2,
                }),
            }),
        });
    });

    it("posts version metadata to the generic attachment route", async () => {
        const result = await uploadAttachmentVersionViaApi({
            attachmentId: "att_api_1",
            fileName: "attachment-next.pdf",
            mimeType: "application/pdf",
            sizeBytes: 4096,
        });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            "/api/attachments/versions",
            expect.objectContaining({
                method: "POST",
            }),
        );
        expect(result).toEqual({
            attachmentId: "att_api_1",
            versionId: "evver_2",
            versionNumber: 2,
        });
    });
});
