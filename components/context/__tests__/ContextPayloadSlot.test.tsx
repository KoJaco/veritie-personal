/// <reference types="jest" />
import { render } from "@testing-library/react";
import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";

const mockUseContextPayloadStore = jest.fn();
const mockSetContextPayload = jest.fn();
const mockDebug = jest.fn();

jest.mock("@/components/context/context-payload-store", () => ({
    useContextPayloadStore: (
        selector: (state: { setContextPayload: unknown }) => unknown,
    ) => mockUseContextPayloadStore(selector),
}));

jest.mock("@/lib/logging/client-logger", () => ({
    logger: {
        debug: (...args: unknown[]) => mockDebug(...args),
    },
}));

describe("ContextPayloadSlot", () => {
    beforeEach(() => {
        mockSetContextPayload.mockReset();
        mockDebug.mockReset();
        mockUseContextPayloadStore.mockImplementation(
            (selector: (state: { setContextPayload: unknown }) => unknown) =>
                selector({ setContextPayload: mockSetContextPayload }),
        );
    });

    it("sets payload on mount and update", () => {
        const payload = {
            scope: { type: "work" as const },
        };

        const { rerender } = render(<ContextPayloadSlot payload={payload} />);

        expect(mockSetContextPayload).toHaveBeenCalledWith(payload);

        const updatedPayload = {
            scope: { type: "task_detail" as const, id: "task_1" },
            primaryObject: { type: "task" as const, id: "task_1" },
        };

        rerender(<ContextPayloadSlot payload={updatedPayload} />);
        expect(mockSetContextPayload).toHaveBeenLastCalledWith(updatedPayload);
    });

    it("clears payload when null is passed", () => {
        render(<ContextPayloadSlot payload={null} source="layout" />);
        expect(mockSetContextPayload).toHaveBeenCalledWith(null);
    });

    it("handles payload with only required scope fields", () => {
        render(
            <ContextPayloadSlot
                payload={{ scope: { type: "resources_index" } }}
            />,
        );
        expect(mockSetContextPayload).toHaveBeenCalledWith({
            scope: { type: "resources_index" },
        });
    });
});
