import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";

const mockGetPipelineConfig = jest.fn();
const mockPrepareCapture = jest.fn();
const mockClearPreparedHandle = jest.fn();

jest.mock("@veritie/sdk", () => ({
    useVeritie: () => ({
        prepareCapture: mockPrepareCapture,
        clearPreparedHandle: mockClearPreparedHandle,
        getPipelineConfig: mockGetPipelineConfig,
    }),
}));

import {
    VeritieCaptureLeaseProvider,
    useVeritieCaptureLease,
} from "@/components/capture/VeritieCaptureLeaseContext";
import { resetClientPipelineExtractionConfigForTests } from "@/lib/capture/client-pipeline-config";

function LeaseProbe() {
    const { leasePhase, extractionConfig } = useVeritieCaptureLease();

    return (
        <div>
            <span data-testid="lease-phase">{leasePhase}</span>
            <span data-testid="extraction-keys">
                {extractionConfig.extractionListKeys.join(",")}
            </span>
        </div>
    );
}

describe("VeritieCaptureLeaseContext", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resetClientPipelineExtractionConfigForTests();
        mockPrepareCapture.mockResolvedValue({
            snapshot: {
                jobId: "job-1",
                bootstrap: {
                    stream_ingest: { session_id: "session-1" },
                },
            },
            close: jest.fn(),
        });
        mockGetPipelineConfig.mockResolvedValue({
            version: "v1",
            app: { id: "app-1", name: "App" },
            pipeline: { id: "pipeline-1", name: "Pipeline", alias: "proxy" },
            settings: {
                entities_enabled: true,
                actions_enabled: false,
                action_mode: "suggest_only",
                ingest_mode: "batch_first",
            },
            schema: {
                id: "schema-1",
                version_id: "schema-version-1",
                version: 1,
                definition: {
                    entities: [{ key: "tasks", object_type: "task" }],
                },
            },
            glossary: {
                id: "glossary-1",
                version_id: "glossary-version-1",
                version: 1,
                definition: {
                    entries: [{ key: "tasks", label: "Tasks" }],
                },
            },
            warnings: [],
        });
    });

    it("loads pipeline config on mount", async () => {
        render(
            <VeritieCaptureLeaseProvider>
                <LeaseProbe />
            </VeritieCaptureLeaseProvider>,
        );

        await waitFor(() => {
            expect(mockGetPipelineConfig).toHaveBeenCalled();
        });

        expect(screen.getByTestId("extraction-keys")).toHaveTextContent("tasks");
        expect(mockGetPipelineConfig).toHaveBeenCalledTimes(1);
    });

    it("does not refetch pipeline config on child re-renders", async () => {
        function RerenderProbe() {
            const { leasePhase } = useVeritieCaptureLease();
            return <span data-testid="lease-phase">{leasePhase}</span>;
        }

        const { rerender } = render(
            <VeritieCaptureLeaseProvider>
                <RerenderProbe />
            </VeritieCaptureLeaseProvider>,
        );

        await waitFor(() => {
            expect(mockGetPipelineConfig).toHaveBeenCalledTimes(1);
        });

        rerender(
            <VeritieCaptureLeaseProvider>
                <RerenderProbe />
            </VeritieCaptureLeaseProvider>,
        );

        expect(mockGetPipelineConfig).toHaveBeenCalledTimes(1);
    });

    it("prepareLease sets ready phase", async () => {
        function PrepareProbe() {
            const { prepareLease, leasePhase } = useVeritieCaptureLease();

            return (
                <div>
                    <span data-testid="lease-phase">{leasePhase}</span>
                    <button
                        type="button"
                        onClick={() =>
                            void prepareLease({
                                captured_at: "2026-01-01T00:00:00.000Z",
                                timezone: "UTC",
                                locale: "en",
                            })
                        }
                    >
                        Prepare
                    </button>
                </div>
            );
        }

        render(
            <VeritieCaptureLeaseProvider>
                <PrepareProbe />
            </VeritieCaptureLeaseProvider>,
        );

        screen.getByRole("button", { name: "Prepare" }).click();

        await waitFor(() => {
            expect(screen.getByTestId("lease-phase")).toHaveTextContent("ready");
        });

        expect(mockPrepareCapture).toHaveBeenCalled();
    });
});
