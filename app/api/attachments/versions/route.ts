import { NextRequest, NextResponse } from "next/server";

import { requireSessionApiAccess } from "@/lib/api/require-session-api-access";
import {
    BoundedBodyError,
    boundedBodyErrorResponse,
    readBoundedJson,
} from "@/lib/api/read-bounded-body";
import {
    ATTACHMENTS_API_MAX_BODY_BYTES,
    uploadAttachmentVersionSchema,
} from "@/lib/attachments/upload-attachment-version-schema";
import { getDataSourceAdapters } from "@/lib/data-source";
import { getDataSourceKind } from "@/lib/data-source/registry";
import { logger } from "@/lib/logging/server-logger";

/** In-app attachment version upload. Stub mode only until backend adapter ships. */
export async function POST(request: NextRequest) {
    const denied = await requireSessionApiAccess();
    if (denied) {
        return denied;
    }

    if (getDataSourceKind() === "backend") {
        return NextResponse.json(
            {
                error:
                    "Attachment uploads are not available in database-backed mode yet",
            },
            { status: 503 },
        );
    }

    try {
        const rawBody = await readBoundedJson(
            request,
            ATTACHMENTS_API_MAX_BODY_BYTES,
        );
        const parsed = uploadAttachmentVersionSchema.safeParse(rawBody);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Invalid request body",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const body = parsed.data;
        const result = getDataSourceAdapters().attachments.uploadAttachmentVersion({
            attachmentId: body.attachmentId,
            title: body.title,
            description: body.description,
            kind: body.kind,
            fileName: body.fileName,
            mimeType: body.mimeType,
            sizeBytes: body.sizeBytes,
            validFrom: body.validFrom,
            validUntil: body.validUntil,
        });

        return NextResponse.json({
            attachmentId: result.attachmentId,
            versionId: result.versionId,
            versionNumber: result.versionNumber,
        });
    } catch (error) {
        if (error instanceof BoundedBodyError) {
            return boundedBodyErrorResponse(error);
        }

        logger.error("[attachments] upload_version_failed", {
            error: error instanceof Error ? error : String(error),
        });
        return NextResponse.json(
            { error: "Failed to upload attachment version" },
            { status: 500 },
        );
    }
}
