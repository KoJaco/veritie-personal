import { render, screen } from "@testing-library/react";
import { AssistantTab } from "@/components/context/tabs/AssistantTab";

const mockUseRailContract = jest.fn();
let mockRunPhase: "hydrating" | "aligning" | "ready" | "running" | "error" | null = "ready";
let mockHasHydrated = true;

jest.mock("@/components/context/client-route-resolver", () => ({
  useRailContract: () => mockUseRailContract(),
}));

jest.mock("@/components/assistant-ui/assistant-run-state-store", () => ({
  useAssistantRunStateStore: (selector: (state: { threads: Record<string, { phase: string; updatedAt: number }> }) => unknown) =>
    selector(
      mockRunPhase
        ? { threads: { "thread:key": { phase: mockRunPhase, updatedAt: 1 } } }
        : { threads: {} },
    ),
}));

jest.mock("@/components/assistant-ui/chat-store", () => {
  const useChatStore = jest.fn();
  (useChatStore as unknown as { persist: unknown }).persist = {
    hasHydrated: () => mockHasHydrated,
    onFinishHydration: () => () => {},
  };
  return { useChatStore };
});

jest.mock("@/components/assistant-ui/thread-key", () => ({
  getThreadKey: () => "thread:key",
}));

jest.mock("@/components/assistant-ui/AssistantProvider", () => ({
  AssistantProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="assistant-provider">{children}</div>
  ),
}));

jest.mock("@/components/assistant-ui/thread", () => ({
  Thread: ({ threadKey }: { threadKey: string }) => (
    <div data-testid="assistant-thread">{threadKey}</div>
  ),
}));

jest.mock("@/lib/logging/client-logger", () => ({
  logger: { debug: jest.fn() },
}));

describe("AssistantTab", () => {
  beforeEach(() => {
    mockRunPhase = "ready";
    mockHasHydrated = true;
  });

  it.each([
    ["timeline", "timeline"],
    ["captures_index", "captures_index"],
    ["capture_detail", "capture_detail"],
    ["task_detail", "task_detail"],
    ["task_index", "task_index"],
    ["records_detail", "records_detail"],
    ["records_index", "records_index"],
    ["resources_detail", "resources_detail"],
    ["resources_index", "resources_index"],
    ["settings", "settings"],
  ] as const)(
    "renders assistant thread when route scope matches: %s",
    (routeId, scopeType) => {
      mockUseRailContract.mockReturnValue({
        routeId,
        context: { scope: { type: scopeType } },
      });

      render(<AssistantTab />);

      expect(screen.getByTestId("assistant-provider")).toBeInTheDocument();
      expect(screen.getByTestId("assistant-thread")).toHaveTextContent("thread:key");
      expect(screen.queryByTestId("assistant-loading")).not.toBeInTheDocument();
    },
  );

  it("shows loading skeleton and does not render assistant thread when route scope mismatches", () => {
    mockUseRailContract.mockReturnValue({
      routeId: "timeline",
      context: { scope: { type: "task_index" } },
    });

    render(<AssistantTab />);

    expect(screen.getByTestId("assistant-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("assistant-provider")).not.toBeInTheDocument();
    expect(screen.queryByTestId("assistant-thread")).not.toBeInTheDocument();
  });

  it("shows loading skeleton and does not render assistant thread when scope is missing", () => {
    mockUseRailContract.mockReturnValue({
      routeId: "timeline",
      context: undefined,
    });

    render(<AssistantTab />);

    expect(screen.getByTestId("assistant-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("assistant-provider")).not.toBeInTheDocument();
  });

  it("renders assistant thread for unknown route ids (default branch)", () => {
    mockUseRailContract.mockReturnValue({
      routeId: "unknown",
      context: { scope: { type: "timeline" } },
    });

    render(<AssistantTab />);

    expect(screen.getByTestId("assistant-provider")).toBeInTheDocument();
  });

  it("shows loading skeleton when chat hydration is not ready", () => {
    mockHasHydrated = false;
    mockUseRailContract.mockReturnValue({
      routeId: "timeline",
      context: { scope: { type: "timeline" } },
    });

    render(<AssistantTab />);

    expect(screen.getByTestId("assistant-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("assistant-provider")).not.toBeInTheDocument();
  });

  it.each(["hydrating", "aligning", null] as const)(
    "shows loading skeleton when run phase is %s",
    (phase) => {
      mockRunPhase = phase;
      mockUseRailContract.mockReturnValue({
        routeId: "timeline",
        context: { scope: { type: "timeline" } },
      });

      render(<AssistantTab />);

      expect(screen.getByTestId("assistant-loading")).toBeInTheDocument();
      expect(screen.getByTestId("assistant-provider")).toBeInTheDocument();
    },
  );
});
