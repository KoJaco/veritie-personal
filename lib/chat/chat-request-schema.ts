import { z } from "zod";

const CHAT_MESSAGE_MAX_CONTENT_CHARS = 8192;
const CHAT_MAX_MESSAGES = 50;
const CHAT_CONTEXT_MAX_CHARS = 16_384;

export const chatRequestSchema = z.object({
    threadKey: z.string().trim().min(1).max(128),
    messages: z
        .array(
            z.object({
                id: z.string().trim().min(1).max(128),
                role: z.enum(["user", "assistant"]),
                content: z.string().max(CHAT_MESSAGE_MAX_CONTENT_CHARS),
            }),
        )
        .max(CHAT_MAX_MESSAGES),
    context: z.union([
        z.string().max(CHAT_CONTEXT_MAX_CHARS),
        z.record(z.string(), z.unknown()),
    ]).optional(),
});

export type ChatRequestParsed = z.infer<typeof chatRequestSchema>;

export const CHAT_API_MAX_BODY_BYTES = 64 * 1024;
