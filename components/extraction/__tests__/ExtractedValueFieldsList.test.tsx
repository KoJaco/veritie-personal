import { fireEvent, render, screen } from "@testing-library/react";
import { ExtractedValueFieldsList } from "@/components/extraction/ExtractedValueFieldsList";
import type { ExtractedValueStub } from "@/lib/stubs/capture-stubs";

const extractedValue: ExtractedValueStub = {
    id: "extracted_expense_chemist",
    extractionRunId: "extraction_run_morning",
    captureId: "capture_seed_morning_log",
    objectType: "money_entry",
    aspect: "finance",
    title: "Chemist Warehouse vitamins",
    fields: {
        amount: 42,
        currency: "AUD",
        merchantOrPayee: "Chemist Warehouse",
        source_quote: "Spent forty two dollars at Chemist Warehouse for vitamins.",
    },
    confidence: 0.91,
    reviewState: "pending",
    createdAt: "2026-08-01T08:22:30.000Z",
    updatedAt: "2026-08-01T08:22:30.000Z",
};

describe("ExtractedValueFieldsList", () => {
    it("renders inline field keys and values without aspect or title", () => {
        render(<ExtractedValueFieldsList extractedValue={extractedValue} />);

        expect(screen.getByText("Amount:")).toBeInTheDocument();
        expect(screen.getByText("42")).toBeInTheDocument();
        expect(screen.getByText("Currency:")).toBeInTheDocument();
        expect(screen.getByText("AUD")).toBeInTheDocument();
        expect(screen.getByText("MerchantOrPayee:")).toBeInTheDocument();
        expect(screen.getByText("Chemist Warehouse")).toBeInTheDocument();
        expect(screen.queryByText(/^finance$/i)).not.toBeInTheDocument();
        expect(
            screen.queryByText("Chemist Warehouse vitamins"),
        ).not.toBeInTheDocument();
        expect(screen.queryByText(/source quote/i)).not.toBeInTheDocument();
    });

    it("renders source quote on its own line", () => {
        render(<ExtractedValueFieldsList extractedValue={extractedValue} />);

        expect(
            screen.getByText(/Spent forty two dollars at Chemist Warehouse/i),
        ).toBeInTheDocument();
    });

    it("supports field activation for transcript highlight", () => {
        const onFieldActivate = jest.fn();

        render(
            <ExtractedValueFieldsList
                extractedValue={extractedValue}
                onFieldActivate={onFieldActivate}
            />,
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: /Spent forty two dollars at Chemist Warehouse/i,
            }),
        );

        expect(onFieldActivate).toHaveBeenCalledWith(
            "source_quote",
            "Spent forty two dollars at Chemist Warehouse for vitamins.",
        );
    });
});
