import { renderHook } from "@testing-library/react";
import { useRailContract } from "@/components/context/client-route-resolver";

const mockUseSelectedLayoutSegments = jest.fn();
const mockUseContextPayloadStore = jest.fn();

jest.mock("next/navigation", () => ({
    useSelectedLayoutSegments: () => mockUseSelectedLayoutSegments(),
}));

jest.mock("@/components/context/context-payload-store", () => ({
    useContextPayloadStore: (
        selector: (state: { contextPayload: unknown }) => unknown,
    ) => mockUseContextPayloadStore(selector),
}));

jest.mock("@/lib/logging/client-logger", () => ({
    logger: {
        debug: jest.fn(),
    },
}));

describe("useRailContract", () => {
    beforeEach(() => {
        mockUseContextPayloadStore.mockImplementation(
            (selector: (state: { contextPayload: unknown }) => unknown) =>
                selector({ contextPayload: null }),
        );
    });

    it("maps scope routes and preserves payload context", () => {
        mockUseContextPayloadStore.mockImplementation(
            (selector: (state: { contextPayload: unknown }) => unknown) =>
                selector({
                    contextPayload: { scope: { type: "scopes_operations_readiness" } },
                }),
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["scopes", "operations-readiness"]);
        const { result } = renderHook(() => useRailContract());

        expect(result.current.routeId).toBe("scopes_operations_readiness");
        expect(result.current.context?.scope).toEqual({
            type: "scopes_operations_readiness",
        });
    });

    it("maps active work routes correctly", () => {
        mockUseSelectedLayoutSegments.mockReturnValue([
            "scopes",
            "delivery-observability",
        ]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "scopes_delivery_observability",
        );

        mockUseSelectedLayoutSegments.mockReturnValue([
            "scopes",
            "workspace-resilience",
        ]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "scopes_workspace_resilience",
        );

        mockUseSelectedLayoutSegments.mockReturnValue([
            "scopes",
            "operations-readiness",
            "checks",
            "check_1",
        ]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "scope_check_detail",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["tasks"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "task_index",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["tasks", "abc"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "task_detail",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["documents"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "documents_index",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["documents", "obj-1"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "documents_detail",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["resources"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "resources_index",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["resources", "asset-1"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "resources_detail",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["connections"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "connections_index",
        );

        mockUseSelectedLayoutSegments.mockReturnValue([
            "connections",
            "conn_azure_ad",
        ]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "connections_detail",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["settings"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "settings",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["scopes"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "scopes_index",
        );

        mockUseSelectedLayoutSegments.mockReturnValue([]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "work",
        );
    });

    it.each([["assets"], ["evidence"], ["controls"], ["frameworks"]] as const)(
        "maps retired legacy route segment %s to unknown",
        (segment) => {
            mockUseSelectedLayoutSegments.mockReturnValue([segment]);
            expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
                "unknown",
            );
        },
    );

    it("falls back to unknown route config for unsupported segments", () => {
        mockUseSelectedLayoutSegments.mockReturnValue(["unsupported"]);
        const { result } = renderHook(() => useRailContract());

        expect(result.current.routeId).toBe("unknown");
        expect(result.current.contractVersion).toBe(1);
        expect(result.current.enabled).toBe(false);
        expect(result.current.tabs).toEqual([]);
        expect(result.current.context).toBeUndefined();
    });
});
