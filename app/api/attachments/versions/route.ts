import { NextRequest, NextResponse } from "next/server";
import { getDataSourceAdapters } from "@/lib/data-source";
import type { AttachmentKind } from "@/lib/data-source";

type UploadAttachmentVersionRequest = {
    attachmentId?: string;
    title?: string;
    description?: string;
    kind?: string;
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
    validFrom?: string;
    validUntil?: string;
};

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function isAttachmentKind(value: unknown): value is AttachmentKind {
    return (
        value === "policy" ||
        value === "procedure" ||
        value === "report" ||
        value === "export" ||
        value === "screenshot" ||
        value === "log" ||
        value === "attestation" ||
        value === "other"
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as UploadAttachmentVersionRequest;

        if (
            !isNonEmptyString(body.attachmentId) ||
            !isNonEmptyString(body.fileName)
        ) {
            return NextResponse.json(
                {
                    error: "attachmentId and fileName are required",
                },
                { status: 400 },
            );
        }

        const result = getDataSourceAdapters().attachments.uploadAttachmentVersion({
            attachmentId: body.attachmentId,
            title: isNonEmptyString(body.title) ? body.title : undefined,
            description: isNonEmptyString(body.description)
                ? body.description
                : undefined,
            kind: isAttachmentKind(body.kind) ? body.kind : undefined,
            fileName: body.fileName,
            mimeType: isNonEmptyString(body.mimeType) ? body.mimeType : undefined,
            sizeBytes:
                typeof body.sizeBytes === "number" ? body.sizeBytes : undefined,
            validFrom: isNonEmptyString(body.validFrom) ? body.validFrom : undefined,
            validUntil: isNonEmptyString(body.validUntil)
                ? body.validUntil
                : undefined,
        });

        return NextResponse.json({
            attachmentId: result.attachmentId,
            versionId: result.versionId,
            versionNumber: result.versionNumber,
        });
    } catch (error) {
        console.error("Attachment version upload API error:", error);
        return NextResponse.json(
            { error: "Failed to upload attachment version" },
            { status: 500 },
        );
    }
}
