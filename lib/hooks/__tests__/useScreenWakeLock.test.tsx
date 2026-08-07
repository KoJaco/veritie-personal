import { renderHook, waitFor } from "@testing-library/react";
import { useScreenWakeLock } from "@/lib/hooks/useScreenWakeLock";

const mockRelease = jest.fn(async () => undefined);
const mockAcquireScreenWakeLock = jest.fn();

jest.mock("@/lib/capture/screen-wake-lock", () => ({
    acquireScreenWakeLock: () => mockAcquireScreenWakeLock(),
}));

describe("useScreenWakeLock", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAcquireScreenWakeLock.mockResolvedValue({
            release: mockRelease,
        });
    });

    it("acquires when enabled changes from false to true", async () => {
        const { rerender } = renderHook(
            ({ enabled }: { enabled: boolean }) => useScreenWakeLock(enabled),
            { initialProps: { enabled: false } },
        );

        expect(mockAcquireScreenWakeLock).not.toHaveBeenCalled();

        rerender({ enabled: true });

        await waitFor(() => {
            expect(mockAcquireScreenWakeLock).toHaveBeenCalledTimes(1);
        });
    });

    it("releases when enabled changes from true to false", async () => {
        const { rerender } = renderHook(
            ({ enabled }: { enabled: boolean }) => useScreenWakeLock(enabled),
            { initialProps: { enabled: true } },
        );

        await waitFor(() => {
            expect(mockAcquireScreenWakeLock).toHaveBeenCalledTimes(1);
        });

        rerender({ enabled: false });

        await waitFor(() => {
            expect(mockRelease).toHaveBeenCalledTimes(1);
        });
    });
});
