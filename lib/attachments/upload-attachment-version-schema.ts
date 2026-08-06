import { z } from "zod";

const ATTACHMENT_KINDS = [
    "policy",
    "procedure",
    "report",
    "export",
    "screenshot",
    "log",
    "attestation",
    "other",
] as const;

export const uploadAttachmentVersionSchema = z.object({
    attachmentId: z.string().trim().min(1).max(128),
    title: z.string().trim().max(256).optional(),
    description: z.string().trim().max(2000).optional(),
    kind: z.enum(ATTACHMENT_KINDS).optional(),
    fileName: z.string().trim().min(1).max(256),
    mimeType: z.string().trim().max(128).optional(),
    sizeBytes: z.number().int().nonnegative().max(512 * 1024 * 1024).optional(),
    validFrom: z.string().trim().max(64).optional(),
    validUntil: z.string().trim().max(64).optional(),
});

export type UploadAttachmentVersionParsed = z.infer<
    typeof uploadAttachmentVersionSchema
>;

export const ATTACHMENTS_API_MAX_BODY_BYTES = 64 * 1024;
