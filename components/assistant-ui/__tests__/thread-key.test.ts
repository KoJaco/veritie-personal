import { describe, expect, it } from "@jest/globals";

import { getThreadKey } from "@/components/assistant-ui/thread-key";

describe("getThreadKey", () => {
  it("returns routeId when context is missing", () => {
    expect(getThreadKey("work", undefined)).toBe("work");
  });

  it("returns fallback routeId when scope does not match route", () => {
    const context = {
      scope: { type: "task_detail", id: "task-1" },
    } as const;

    expect(getThreadKey("resources_detail", context as never)).toBe("resources_detail");
  });

  it("maps task detail scope to deterministic thread key", () => {
    const context = {
      scope: { type: "task_detail", id: "task-123" },
    } as const;

    expect(getThreadKey("task_detail", context as never)).toBe("task:task-123");
  });

  it("maps check detail scope to deterministic thread key", () => {
    const context = {
      scope: { type: "scope_check_detail", id: "check-456" },
    } as const;

    expect(getThreadKey("scope_check_detail", context as never)).toBe("check:check-456");
  });

  it("maps documents detail and index scopes", () => {
    const detailContext = {
      scope: { type: "documents_detail", id: "obj-7" },
    } as const;

    const indexContext = {
      scope: { type: "documents_index" },
    } as const;

    expect(getThreadKey("documents_detail", detailContext as never)).toBe("document:obj-7");
    expect(getThreadKey("documents_index", indexContext as never)).toBe("document:index");
  });

  it("maps resources detail and index scopes", () => {
    const detailContext = {
      scope: { type: "resources_detail", id: "resource-7" },
    } as const;

    const indexContext = {
      scope: { type: "resources_index" },
    } as const;

    expect(getThreadKey("resources_detail", detailContext as never)).toBe("resource:resource-7");
    expect(getThreadKey("resources_index", indexContext as never)).toBe("resource:index");
  });

  it("maps singleton routes", () => {
    const workContext = { scope: { type: "work" } } as const;
    const connectionsIndexContext = {
      scope: { type: "connections_index" },
    } as const;
    const connectionsDetailContext = {
      scope: { type: "connections_detail", id: "conn_123" },
    } as const;

    expect(getThreadKey("work", workContext as never)).toBe("work");
    expect(getThreadKey("connections_index", connectionsIndexContext as never)).toBe(
      "connections:index",
    );
    expect(getThreadKey("connections_detail", connectionsDetailContext as never)).toBe(
      "connection:conn_123",
    );
  });
});
