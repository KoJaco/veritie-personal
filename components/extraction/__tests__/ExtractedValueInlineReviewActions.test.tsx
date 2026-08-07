import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ExtractedValueInlineReviewActions } from "@/components/extraction/ExtractedValueInlineReviewActions";

jest.mock("@/lib/actions/stub-data-mutations", () => ({
    updateExtractedValueReviewAction: jest.fn(),
}));

const { updateExtractedValueReviewAction } = jest.requireMock<{
    updateExtractedValueReviewAction: jest.Mock;
}>("@/lib/actions/stub-data-mutations");

describe("ExtractedValueInlineReviewActions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        updateExtractedValueReviewAction.mockResolvedValue({ ok: true });
    });

    it("submits accept from pending", async () => {
        const onUpdated = jest.fn();

        render(
            <ExtractedValueInlineReviewActions
                extractedValueId="extracted_task_medibank"
                reviewState="pending"
                onUpdated={onUpdated}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /accept/i }));

        await waitFor(() => {
            expect(updateExtractedValueReviewAction).toHaveBeenCalledWith(
                "extracted_task_medibank",
                "confirmed",
            );
            expect(onUpdated).toHaveBeenCalledWith("confirmed");
        });
    });

    it("submits rollback from confirmed", async () => {
        const onUpdated = jest.fn();

        render(
            <ExtractedValueInlineReviewActions
                extractedValueId="extracted_task_medibank"
                reviewState="confirmed"
                onUpdated={onUpdated}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /undo/i }));

        await waitFor(() => {
            expect(updateExtractedValueReviewAction).toHaveBeenCalledWith(
                "extracted_task_medibank",
                "pending",
            );
            expect(onUpdated).toHaveBeenCalledWith("pending");
        });
    });
});
