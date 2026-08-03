/// <reference types="jest" />
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ContextRailProvider, useContextRail } from "@/components/context/ContextRailProvider";

const mockError = jest.fn();

jest.mock("@/lib/logging/client-logger", () => ({
  logger: {
    error: (...args: unknown[]) => mockError(...args),
  },
}));

function TestConsumer() {
  const { state, isHydrated, open, close, pin, unpin, toggle } = useContextRail();

  return (
    <div>
      <div data-testid="state">{state}</div>
      <div data-testid="hydrated">{String(isHydrated)}</div>
      <button onClick={open}>open</button>
      <button onClick={close}>close</button>
      <button onClick={pin}>pin</button>
      <button onClick={unpin}>unpin</button>
      <button onClick={toggle}>toggle</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <ContextRailProvider>
      <TestConsumer />
    </ContextRailProvider>,
  );
}

describe("ContextRailProvider", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockError.mockReset();
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1280,
    });
  });

  it("defaults to CLOSED and hydrates to true", async () => {
    renderProvider();

    expect(screen.getByTestId("state").textContent).toBe("CLOSED");
    await waitFor(() =>
      expect(screen.getByTestId("hydrated").textContent).toBe("true"),
    );
  });

  it("hydrates from persisted PINNED_DOCKED state", async () => {
    sessionStorage.setItem("taskContextState", "PINNED_DOCKED");

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("state").textContent).toBe("PINNED_DOCKED"),
    );
    expect(screen.getByTestId("hydrated").textContent).toBe("true");
  });

  it("pins and unpins with sessionStorage persistence", async () => {
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "pin" }));
    expect(screen.getByTestId("state").textContent).toBe("PINNED_DOCKED");
    expect(sessionStorage.getItem("taskContextState")).toBe("PINNED_DOCKED");

    fireEvent.click(screen.getByRole("button", { name: "unpin" }));
    expect(screen.getByTestId("state").textContent).toBe("OPEN_OVERLAY");
    expect(sessionStorage.getItem("taskContextState")).toBeNull();

    await waitFor(() =>
      expect(screen.getByTestId("hydrated").textContent).toBe("true"),
    );
  });

  it("downgrades PINNED_DOCKED to OPEN_OVERLAY on mobile resize", async () => {
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "pin" }));
    expect(screen.getByTestId("state").textContent).toBe("PINNED_DOCKED");
    expect(sessionStorage.getItem("taskContextState")).toBe("PINNED_DOCKED");

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 768,
      });
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.getByTestId("state").textContent).toBe("OPEN_OVERLAY");
    expect(sessionStorage.getItem("taskContextState")).toBeNull();
  });
});
