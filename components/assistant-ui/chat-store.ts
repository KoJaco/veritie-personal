import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string; // markdown
    createdAt: number;
};

type ThreadState = {
    messages: ChatMessage[];
};

type ChatStore = {
    threads: Record<string, ThreadState>;
    getThread: (threadKey: string) => ThreadState;
    setThreadMessages: (threadKey: string, messages: ChatMessage[]) => void;
    appendMessage: (threadKey: string, msg: ChatMessage) => void;
    clearThread: (threadKey: string) => void;

    // MVP stub: backend sync hooks (no-op for now)
    hydrateFromBackend: (threadKey: string) => Promise<void>;
    flushToBackend: (threadKey: string) => Promise<void>;
};

export const useChatStore = create<ChatStore>()(
    persist(
        (set, get) => ({
            threads: {},
            getThread: (threadKey) =>
                get().threads[threadKey] ?? { messages: [] },

            setThreadMessages: (threadKey, messages) =>
                set((s) => ({
                    threads: { ...s.threads, [threadKey]: { messages } },
                })),

            appendMessage: (threadKey, msg) =>
                set((s) => {
                    const existing = s.threads[threadKey]?.messages ?? [];
                    return {
                        threads: {
                            ...s.threads,
                            [threadKey]: { messages: [...existing, msg] },
                        },
                    };
                }),

            clearThread: (threadKey) =>
                set((s) => {
                    // eslint-disable-next-line
                    const { [threadKey]: _removed, ...rest } = s.threads;
                    return { threads: rest };
                }),

            hydrateFromBackend: async () => {
                // TODO: call /api/chat/history?threadKey=...
            },
            flushToBackend: async () => {
                // TODO: call /api/chat/history (POST)
            },
        }),
        {
            name: "assistant:chat:v1",
            version: 2,
            migrate: (persistedState) => {
                const state = persistedState as
                    | {
                          threads?: Record<
                              string,
                              {
                                  messages?: Array<{
                                      id?: unknown;
                                      role?: unknown;
                                      content?: unknown;
                                      createdAt?: unknown;
                                  }>;
                              }
                          >;
                      }
                    | undefined;

                if (!state?.threads) {
                    return { threads: {} };
                }

                const threads: Record<string, ThreadState> = {};

                for (const [threadKey, thread] of Object.entries(
                    state.threads,
                )) {
                    const messages = Array.isArray(thread?.messages)
                        ? thread.messages
                        : [];

                    threads[threadKey] = {
                        messages: messages.map((message, index) => ({
                            id:
                                typeof message.id === "string"
                                    ? message.id
                                    : `${threadKey}-${index}`,
                            role:
                                message.role === "user" ? "user" : "assistant",
                            content:
                                typeof message.content === "string"
                                    ? message.content
                                    : "",
                            createdAt:
                                typeof message.createdAt === "number" &&
                                Number.isFinite(message.createdAt)
                                    ? message.createdAt
                                    : Date.now(),
                        })),
                    };
                }

                return { threads };
            },
        },
    ),
);
