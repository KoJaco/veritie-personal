import { beforeEach, describe, expect, it } from "@jest/globals";
import { useFocusContextStore } from "@/components/context/focus-context-store";

describe("useFocusContextStore", () => {
    beforeEach(() => {
        useFocusContextStore.setState({ focusContext: null });
    });

    it("sets and clears focus context", () => {
        useFocusContextStore.getState().setFocusContext({
            entityPointer: { kind: "task", id: "task-123" },
            subviewPointer: { kind: "section", id: "blocking" },
            intent: "triage",
        });

        expect(useFocusContextStore.getState().focusContext).toMatchObject({
            entityPointer: { kind: "task", id: "task-123" },
            subviewPointer: { kind: "section", id: "blocking" },
            intent: "triage",
        });

        useFocusContextStore.getState().clearFocusContext();

        expect(useFocusContextStore.getState().focusContext).toBeNull();
    });
});
