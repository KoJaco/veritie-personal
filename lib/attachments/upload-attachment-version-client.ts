import type { AttachmentKind } from "@/lib/data-source";

export type UploadAttachmentVersionInput = {
    attachmentId: string;
    title?: string;
    description?: string;
    kind?: AttachmentKind;
    fileName: string;
    mimeType?: string;
    sizeBytes?: number;
    validFrom?: string;
    validUntil?: string;
};

export type UploadAttachmentVersionResult = {
    attachmentId: string;
    versionId: string;
    versionNumber: number;
};

export async function uploadAttachmentVersionViaApi(
    input: UploadAttachmentVersionInput,
): Promise<UploadAttachmentVersionResult> {
    const response = await fetch("/api/attachments/versions", {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        throw new Error("Attachment version upload request failed");
    }

    return (await response.json()) as UploadAttachmentVersionResult;
}
