import { beforeEach, describe, expect, it } from "@jest/globals";
import { useAssistantRunStateStore } from "@/components/assistant-ui/assistant-run-state-store";

describe("useAssistantRunStateStore", () => {
    beforeEach(() => {
        useAssistantRunStateStore.setState({ threads: {} });
    });

    it("tracks phase transitions per thread", () => {
        const threadKey = "task:123";
        const store = useAssistantRunStateStore.getState();

        store.markHydrating(threadKey);
        expect(store.getThreadState(threadKey)?.phase).toBe("hydrating");

        store.markAligning(threadKey);
        expect(store.getThreadState(threadKey)?.phase).toBe("aligning");

        store.markReady(threadKey);
        expect(store.getThreadState(threadKey)?.phase).toBe("ready");

        store.markRunning(threadKey);
        expect(store.getThreadState(threadKey)?.phase).toBe("running");
    });

    it("records errors and clears thread state", () => {
        const threadKey = "attachment:abc";
        const store = useAssistantRunStateStore.getState();

        store.markError(threadKey, new Error("network down"));
        expect(store.getThreadState(threadKey)).toMatchObject({
            phase: "error",
            lastError: "network down",
        });

        store.clear(threadKey);
        expect(store.getThreadState(threadKey)).toBeNull();
    });
});
