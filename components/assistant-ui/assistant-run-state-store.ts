import { create } from "zustand";
import { logger } from "@/lib/logging/client-logger";

export type AssistantRunPhase =
    | "hydrating"
    | "aligning"
    | "ready"
    | "running"
    | "error";

export type AssistantThreadRunState = {
    phase: AssistantRunPhase;
    updatedAt: number;
    lastError?: string;
};

type AssistantRunStateStore = {
    threads: Record<string, AssistantThreadRunState>;
    markHydrating: (threadKey: string) => void;
    markAligning: (threadKey: string) => void;
    markReady: (threadKey: string) => void;
    markRunning: (threadKey: string) => void;
    markError: (threadKey: string, error: unknown) => void;
    clear: (threadKey: string) => void;
    getThreadState: (threadKey: string) => AssistantThreadRunState | null;
};

function toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

function setPhase(
    threadKey: string,
    phase: AssistantRunPhase,
    lastError?: string,
) {
    return (state: AssistantRunStateStore) => ({
        threads: {
            ...state.threads,
            [threadKey]: {
                phase,
                updatedAt: Date.now(),
                ...(lastError ? { lastError } : {}),
            },
        },
    });
}

export const useAssistantRunStateStore = create<AssistantRunStateStore>(
    (set, get) => ({
        threads: {},
        markHydrating: (threadKey) => {
            logger.debug("[assistant-run] hydrating", { threadKey });
            set(setPhase(threadKey, "hydrating"));
        },
        markAligning: (threadKey) => {
            logger.debug("[assistant-run] aligning", { threadKey });
            set(setPhase(threadKey, "aligning"));
        },
        markReady: (threadKey) => {
            logger.debug("[assistant-run] ready", { threadKey });
            set(setPhase(threadKey, "ready"));
        },
        markRunning: (threadKey) => {
            logger.debug("[assistant-run] running", { threadKey });
            set(setPhase(threadKey, "running"));
        },
        markError: (threadKey, error) => {
            const message = toErrorMessage(error);
            logger.error("[assistant-run] error", { threadKey, error: message });
            set(setPhase(threadKey, "error", message));
        },
        clear: (threadKey) =>
            set((state) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { [threadKey]: _removed, ...rest } = state.threads;
                return { threads: rest };
            }),
        getThreadState: (threadKey) => get().threads[threadKey] ?? null,
    }),
);
