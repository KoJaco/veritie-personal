import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type MessageRole = "user" | "assistant";

interface ChatRequest {
    threadKey: string;
    messages: Array<{ id: string; role: MessageRole; content: string }>;
    context?: unknown;
}

const ALLOWED_ROLES = new Set<MessageRole>(["user", "assistant"]);

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { messages, context, threadKey } = body;

        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Get model from env or use default
        const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

        const safeMessages = messages
            .filter((msg) => ALLOWED_ROLES.has(msg.role))
            .map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));

        const systemContext =
            typeof context === "string"
                ? context
                : context
                  ? JSON.stringify(context)
                  : "";

        // Call OpenAI Chat Completions API (non-streaming for MVP)
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
        console.error("Chat API error:", error);
        return NextResponse.json(
            { error: "Failed to process chat request" },
            { status: 500 },
        );
    }
}
