import { beforeEach, describe, expect, it } from "@jest/globals";

import { useChatStore } from "@/components/assistant-ui/chat-store";

const STORAGE_KEY = "assistant:chat:v1";

const resetStore = () => {
    useChatStore.setState({ threads: {} });
    useChatStore.persist.clearStorage();
    localStorage.removeItem(STORAGE_KEY);
};

// Tests can be refactored easy for when we have a proper backend for persistence.

describe("useChatStore", () => {
    beforeEach(() => {
        resetStore();
    });

    it("stores messages per thread key", () => {
        const now = Date.now();
        const threadA = `thread:test-a:${now}`;
        const threadB = `thread:test-b:${now}`;
        const msgA = `hello-${now}`;
        const msgB = `world-${now}`;

        useChatStore.getState().setThreadMessages(threadA, [
            {
                id: "1",
                role: "user",
                content: msgA,
                createdAt: 1,
            },
        ]);

        useChatStore.getState().appendMessage(threadB, {
            id: "2",
            role: "assistant",
            content: msgB,
            createdAt: 2,
        });

        expect(
            useChatStore.getState().getThread(threadA).messages,
        ).toHaveLength(1);
        expect(
            useChatStore.getState().getThread(threadB).messages,
        ).toHaveLength(1);
        expect(
            useChatStore.getState().getThread(threadA).messages[0]?.content,
        ).toBe(msgA);
        expect(
            useChatStore.getState().getThread(threadB).messages[0]?.content,
        ).toBe(msgB);
    });

    it("clearThread removes only the target thread", () => {
        useChatStore
            .getState()
            .setThreadMessages("thread:a", [
                { id: "1", role: "user", content: "a", createdAt: 1 },
            ]);
        useChatStore
            .getState()
            .setThreadMessages("thread:b", [
                { id: "2", role: "assistant", content: "b", createdAt: 2 },
            ]);

        useChatStore.getState().clearThread("thread:a");

        expect(useChatStore.getState().getThread("thread:a").messages).toEqual(
            [],
        );
        expect(
            useChatStore.getState().getThread("thread:b").messages,
        ).toHaveLength(1);
    });

    it("migrate normalizes legacy persisted roles and malformed fields", () => {
        const options = useChatStore.persist.getOptions();
        const migrate = options.migrate as (state: unknown) => unknown;

        const migrated = migrate({
            threads: {
                "thread:legacy": {
                    messages: [
                        {
                            id: "msg-1",
                            role: "system",
                            content: "old",
                            createdAt: 123,
                        },
                        {
                            id: 123,
                            role: "invalid",
                            content: null,
                            createdAt: "bad",
                        },
                    ],
                },
            },
        }) as {
            threads: Record<
                string,
                {
                    messages: Array<{
                        id: string;
                        role: "user" | "assistant";
                        content: string;
                        createdAt: number;
                    }>;
                }
            >;
        };

        const messages = migrated.threads["thread:legacy"]?.messages;
        expect(messages).toHaveLength(2);
        expect(messages?.[0]).toMatchObject({
            id: "msg-1",
            role: "assistant",
            content: "old",
            createdAt: 123,
        });
        expect(messages?.[1]?.id).toBe("thread:legacy-1");
        expect(messages?.[1]?.role).toBe("assistant");
        expect(messages?.[1]?.content).toBe("");
        expect(typeof messages?.[1]?.createdAt).toBe("number");
    });
});
