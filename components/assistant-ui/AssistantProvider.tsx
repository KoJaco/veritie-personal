"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocalRuntime, AssistantRuntimeProvider } from "@assistant-ui/react";
import { ChatMessage, useChatStore } from "./chat-store";
import type {
    FocusContext,
    RailContextPayload,
    RouteId,
} from "@/components/context/types";
import type { ChatModelAdapter, ChatModelRunOptions, ChatModelRunResult } from "@assistant-ui/react";
import { TooltipProvider } from "../ui/tooltip";
import { logger } from "@/lib/logging/client-logger";
import { useFocusContextStore } from "@/components/context/focus-context-store";
import { buildInvocationContext } from "./build-invocation-context";
import { useAssistantRunStateStore } from "./assistant-run-state-store";

interface AssistantProviderProps {
    children: React.ReactNode;
    threadKey: string;
    routeId: RouteId;
    context?: RailContextPayload;
}

function AssistantRuntime({
    children,
    threadKey,
    routeId,
    context,
    focusContext,
    getThread,
    setThreadMessages,
    markRunning,
    markReady,
    markError,
}: {
    children: React.ReactNode;
    threadKey: string;
    routeId: RouteId;
    context: RailContextPayload | null;
    focusContext: FocusContext | null;
    getThread: (threadKey: string) => { messages: ChatMessage[] };
    setThreadMessages: (threadKey: string, messages: ChatMessage[]) => void;
    markRunning: (threadKey: string) => void;
    markReady: (threadKey: string) => void;
    markError: (threadKey: string, error: unknown) => void;
}) {
    const toThreadMessages = (messages: ChatModelRunOptions["messages"]) =>
        messages
            .map((msg) => {
                const text = (msg.content ?? [])
                    .filter((part) => part.type === "text")
                    .map((part) => part.text)
                    .join("");

                if (!text) {
                    return null;
                }

                if (msg.role === "system") {
                    // assistant-ui uses system for internal prompts; only keep if it contains a code fence
                    return text.includes("```")
                        ? {
                              id: msg.id,
                              role: "assistant" as const,
                              content: text,
                              createdAt: msg.createdAt
                                  ? new Date(msg.createdAt).getTime()
                                  : Date.now(),
                          }
                        : null;
                }

                if (msg.role !== "user" && msg.role !== "assistant") {
                    return null;
                }

                return {
                    id: msg.id,
                    role: msg.role,
                    content: text,
                    createdAt: msg.createdAt
                        ? new Date(msg.createdAt).getTime()
                        : Date.now(),
                };
            })
            .filter((msg): msg is ChatMessage => msg !== null);

    const chatModelAdapter: ChatModelAdapter = useMemo(
        () => ({
            async run(options: ChatModelRunOptions): Promise<ChatModelRunResult> {
                const { messages } = options;

                try {
                    logger.debug("[assistant] message_parts", {
                        threadKey,
                        parts: messages.map((msg) => ({
                            id: msg.id,
                            role: msg.role,
                            parts: (msg.content ?? []).map((part) => part.type),
                        })),
                    });

                    logger.debug("[assistant] message_text_debug", {
                        threadKey,
                        textMeta: messages.map((msg) => {
                            const text = (msg.content ?? [])
                                .filter((part) => part.type === "text")
                                .map((part) => part.text)
                                .join("");
                            return {
                                id: msg.id,
                                role: msg.role,
                                length: text.length,
                                preview: text.slice(0, 120),
                                hasCodeFence: text.includes("```"),
                            };
                        }),
                    });

                    const threadMessages = toThreadMessages(messages);

                    setThreadMessages(threadKey, threadMessages);
                    markRunning(threadKey);

                    const invocationContext = buildInvocationContext({
                        routeId,
                        routeContext: context,
                        focusContext,
                        threadKey,
                    });

                    const response = await fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            threadKey,
                            messages: threadMessages,
                            context: invocationContext,
                        }),
                    });

                    if (!response.ok) {
                        throw new Error("Failed to send message");
                    }

                    const data = await response.json();

                    setThreadMessages(threadKey, [
                        ...threadMessages,
                        {
                            id: crypto.randomUUID(),
                            role: "assistant",
                            content: data.content,
                            createdAt: Date.now(),
                        },
                    ]);
                    markReady(threadKey);

                    return {
                        content: [
                            {
                                type: "text",
                                text: data.content,
                            } as const,
                        ],
                    };
                } catch (error) {
                    markError(threadKey, error);
                    return {
                        status: {
                            type: "incomplete",
                            reason: "error",
                            error: String(error),
                        },
                    };
                }
            },
        }),
        [
            threadKey,
            routeId,
            setThreadMessages,
            context,
            focusContext,
            markRunning,
            markReady,
            markError,
        ],
    );

    const initialMessages = useMemo(
        () =>
            getThread(threadKey).messages.map((msg: ChatMessage) => ({
                id: msg.id,
                role: msg.role,
                content: [{ type: "text", text: msg.content } as const],
                createdAt: new Date(msg.createdAt),
            })),
        [threadKey, getThread],
    );

    const runtime = useLocalRuntime(chatModelAdapter, { initialMessages });

    useEffect(() => {
        logger.debug("[assistant] runtime", {
            threadKey,
            context,
            initialCount: initialMessages.length,
        });
    }, [threadKey, context, initialMessages]);

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            <TooltipProvider>{children}</TooltipProvider>
        </AssistantRuntimeProvider>
    );
}

export function AssistantProvider({
    children,
    threadKey,
    routeId,
    context,
}: AssistantProviderProps) {
    const getThread = useChatStore((s) => s.getThread);
    const setThreadMessages = useChatStore((s) => s.setThreadMessages);
    const focusContext = useFocusContextStore((s) => s.focusContext);
    const markHydrating = useAssistantRunStateStore((s) => s.markHydrating);
    const markAligning = useAssistantRunStateStore((s) => s.markAligning);
    const markReady = useAssistantRunStateStore((s) => s.markReady);
    const markRunning = useAssistantRunStateStore((s) => s.markRunning);
    const markError = useAssistantRunStateStore((s) => s.markError);
    const clearRunState = useAssistantRunStateStore((s) => s.clear);
    const [hasHydrated, setHasHydrated] = useState(
        useChatStore.persist.hasHydrated(),
    );

    useEffect(() => {
        markHydrating(threadKey);
        return () => {
            clearRunState(threadKey);
        };
    }, [threadKey, markHydrating, clearRunState]);

    useEffect(() => {
        const unsub = useChatStore.persist.onFinishHydration(() => {
            setHasHydrated(true);
            logger.debug("[assistant] hydrated", {
                threadKeys: Object.keys(useChatStore.getState().threads),
            });
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!hasHydrated) {
            markHydrating(threadKey);
            return;
        }

        if (!context?.scope) {
            markAligning(threadKey);
            return;
        }

        markReady(threadKey);
    }, [hasHydrated, context?.scope, threadKey, markHydrating, markAligning, markReady]);

    if (!hasHydrated) {
        logger.debug("[assistant] waiting_for_hydration", { threadKey });
        return null;
    }

    return (
        <AssistantRuntime
            threadKey={threadKey}
            routeId={routeId}
            context={context ?? null}
            focusContext={focusContext}
            getThread={getThread}
            setThreadMessages={setThreadMessages}
            markRunning={markRunning}
            markReady={markReady}
            markError={markError}
        >
            {children}
        </AssistantRuntime>
    );
}
