import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { requireSessionApiAccess } from "@/lib/api/require-session-api-access";
import {
    BoundedBodyError,
    boundedBodyErrorResponse,
    readBoundedJson,
} from "@/lib/api/read-bounded-body";
import { envServer } from "@/lib/config/env.server";
import {
    CHAT_API_MAX_BODY_BYTES,
    chatRequestSchema,
} from "@/lib/chat/chat-request-schema";
import { logger } from "@/lib/logging/server-logger";

/** In-app assistant chat. Requires session; OpenAI key configured server-side. */
export async function POST(request: NextRequest) {
    const denied = await requireSessionApiAccess();
    if (denied) {
        return denied;
    }

    if (!envServer.openaiApiKey) {
        return NextResponse.json(
            { error: "Chat is not configured (missing OPENAI_API_KEY)" },
            { status: 503 },
        );
    }

    try {
        const rawBody = await readBoundedJson(request, CHAT_API_MAX_BODY_BYTES);
        const parsed = chatRequestSchema.safeParse(rawBody);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid chat payload", details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const { messages, context, threadKey } = parsed.data;

        const openai = new OpenAI({
            apiKey: envServer.openaiApiKey,
        });

        const model = envServer.openaiModel;

        const safeMessages = messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));

        const systemContext =
            typeof context === "string"
                ? context
                : context
                  ? JSON.stringify(context)
                  : "";

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                {
                    role: "system",
                    content: `Thread: ${threadKey}\nContext: ${systemContext}`,
                },
                ...safeMessages,
            ],
            temperature: 0.7,
        });

        const assistantMessage = completion.choices[0]?.message?.content || "";

        return NextResponse.json({ content: assistantMessage });
    } catch (error) {
        if (error instanceof BoundedBodyError) {
            return boundedBodyErrorResponse(error);
        }

        logger.error("[chat] request_failed", {
            error: error instanceof Error ? error : String(error),
        });
        return NextResponse.json(
            { error: "Failed to process chat request" },
            { status: 500 },
        );
    }
}
