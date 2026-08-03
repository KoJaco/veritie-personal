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

    it("maps timeline route and preserves payload context", () => {
        mockUseContextPayloadStore.mockImplementation(
            (selector: (state: { contextPayload: unknown }) => unknown) =>
                selector({
                    contextPayload: { scope: { type: "timeline" } },
                }),
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["timeline"]);
        const { result } = renderHook(() => useRailContract());

        expect(result.current.routeId).toBe("timeline");
        expect(result.current.context?.scope).toEqual({
            type: "timeline",
        });
    });

    it("maps active personal app routes correctly", () => {
        mockUseSelectedLayoutSegments.mockReturnValue(["captures"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "captures_index",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["captures", "cap_1"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "capture_detail",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["tasks"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "task_index",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["tasks", "abc"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "task_detail",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["records"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "records_index",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["records", "rec-1"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "records_detail",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["resources"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "resources_index",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["resources", "asset-1"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "resources_detail",
        );

        mockUseSelectedLayoutSegments.mockReturnValue(["settings"]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "settings",
        );

        mockUseSelectedLayoutSegments.mockReturnValue([]);
        expect(renderHook(() => useRailContract()).result.current.routeId).toBe(
            "timeline",
        );
    });

    it.each([["work"], ["scopes"], ["documents"], ["connections"]] as const)(
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
