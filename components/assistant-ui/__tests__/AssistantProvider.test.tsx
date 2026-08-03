import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, waitFor } from "@testing-library/react";
import { useAssistantRunStateStore } from "@/components/assistant-ui/assistant-run-state-store";

let capturedAdapter: {
    run: (options: unknown) => Promise<unknown>;
} | null = null;

const mockGetThread = jest.fn(() => ({ messages: [] as Array<unknown> }));
const mockSetThreadMessages = jest.fn();

jest.mock("@assistant-ui/react", () => ({
    useLocalRuntime: (adapter: unknown) => {
        capturedAdapter = adapter as {
            run: (options: unknown) => Promise<unknown>;
        };
        return { kind: "mock-runtime" };
    },
    AssistantRuntimeProvider: ({ children }: { children: React.ReactNode }) =>
        children,
}));

jest.mock("@/components/ui/tooltip", () => ({
    TooltipProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/assistant-ui/chat-store", () => {
    const useChatStore = <T,>(
        selector: (state: {
            getThread: typeof mockGetThread;
            setThreadMessages: typeof mockSetThreadMessages;
        }) => T,
    ) =>
        selector({
            getThread: mockGetThread,
            setThreadMessages: mockSetThreadMessages,
        });

    useChatStore.persist = {
        hasHydrated: () => true,
        onFinishHydration: () => () => {},
    };

    return {
        useChatStore,
    };
});

jest.mock("@/components/context/focus-context-store", () => ({
    useFocusContextStore: <T,>(
        selector: (state: { focusContext: null }) => T,
    ) => selector({ focusContext: null }),
}));

jest.mock("@/components/assistant-ui/build-invocation-context", () => ({
    buildInvocationContext: () => ({
        schemaVersion: "assistant_invocation_context_v0",
        route: { routeId: "timeline" },
        focus: null,
        snapshot: {},
        meta: {
            builtAt: "2026-03-04T00:00:00.000Z",
            threadKey: "timeline",
            source: "frontend_stub",
        },
    }),
}));

jest.mock("@/lib/logging/client-logger", () => ({
    logger: {
        debug: jest.fn(),
        error: jest.fn(),
    },
}));

describe("AssistantProvider run-state lifecycle", () => {
    beforeEach(() => {
        capturedAdapter = null;
        mockGetThread.mockClear();
        mockSetThreadMessages.mockClear();
        useAssistantRunStateStore.setState({ threads: {} });
        (globalThis as { fetch?: unknown }).fetch = undefined;
    });

    it("transitions ready -> running -> ready on successful run", async () => {
        const { AssistantProvider } = await import(
            "@/components/assistant-ui/AssistantProvider"
        );

        let resolveDeferred:
            | ((value: {
                  ok: boolean;
                  json: () => Promise<{ content: string }>;
              }) => void)
            | undefined;
        const fetchPromise = new Promise<{
            ok: boolean;
            json: () => Promise<{ content: string }>;
        }>((resolve) => {
            resolveDeferred = resolve;
        });

        global.fetch = jest.fn(
            async () => fetchPromise,
        ) as unknown as typeof fetch;

        render(
            <AssistantProvider
                threadKey="timeline"
                routeId="timeline"
                context={{ scope: { type: "timeline" } }}
            >
                <div>child</div>
            </AssistantProvider>,
        );

        await waitFor(() =>
            expect(
                useAssistantRunStateStore.getState().getThreadState("timeline")
                    ?.phase,
            ).toBe("ready"),
        );

        const runPromise = capturedAdapter?.run({
            messages: [
                {
                    id: "u1",
                    role: "user",
                    content: [{ type: "text", text: "hello" }],
                },
            ],
        } as unknown);

        await waitFor(() =>
            expect(
                useAssistantRunStateStore.getState().getThreadState("timeline")
                    ?.phase,
            ).toBe("running"),
        );

        if (!resolveDeferred) {
            throw new Error("resolveDeferred was not captured");
        }
        resolveDeferred({
            ok: true,
            json: async () => ({ content: "assistant response" }),
        });

        await runPromise;

        await waitFor(() =>
            expect(
                useAssistantRunStateStore.getState().getThreadState("timeline")
                    ?.phase,
            ).toBe("ready"),
        );
    });

    it("transitions to error when run fails", async () => {
        const { AssistantProvider } = await import(
            "@/components/assistant-ui/AssistantProvider"
        );

        global.fetch = jest.fn(async () => ({
            ok: false,
            json: async () => ({ content: "" }),
        })) as unknown as typeof fetch;

        render(
            <AssistantProvider
                threadKey="timeline"
                routeId="timeline"
                context={{ scope: { type: "timeline" } }}
            >
                <div>child</div>
            </AssistantProvider>,
        );

        await waitFor(() =>
            expect(
                useAssistantRunStateStore.getState().getThreadState("timeline")
                    ?.phase,
            ).toBe("ready"),
        );

        await capturedAdapter?.run({
            messages: [
                {
                    id: "u1",
                    role: "user",
                    content: [{ type: "text", text: "hello" }],
                },
            ],
        } as unknown);

        await waitFor(() =>
            expect(
                useAssistantRunStateStore.getState().getThreadState("timeline")
                    ?.phase,
            ).toBe("error"),
        );
    });
});
