import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { DocumentsFilters } from "@/app/(app)/work/documents/_components/DocumentsFilters";

jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

jest.mock("@/components/ui/button", () => ({
    Button: ({
        children,
        onClick,
        disabled,
        ...props
    }: {
        children: React.ReactNode;
        onClick?: () => void;
        disabled?: boolean;
    }) => (
        <button type="button" onClick={onClick} disabled={disabled} {...props}>
            {children}
        </button>
    ),
}));

jest.mock("@/components/ui/input", () => ({
    Input: ({
        value,
        onChange,
        onKeyDown,
        placeholder,
        ...props
    }: {
        value?: string;
        onChange?: (event: { target: { value: string } }) => void;
        onKeyDown?: (event: { key: string; preventDefault: () => void }) => void;
        placeholder?: string;
    }) => (
        <input
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange?.(event as never)}
            onKeyDown={(event) => onKeyDown?.(event as never)}
            {...props}
        />
    ),
}));

jest.mock("@/components/ui/popover", () => ({
    Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PopoverTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
        asChild ? children : <div>{children}</div>,
    PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/command", () => ({
    Command: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CommandInput: ({
        placeholder,
        ...props
    }: {
        placeholder?: string;
    }) => <input placeholder={placeholder} {...props} />,
    CommandList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CommandEmpty: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CommandGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CommandItem: ({
        children,
        onSelect,
        value,
    }: {
        children: React.ReactNode;
        onSelect?: (value: string) => void;
        value: string;
    }) => (
        <button type="button" onClick={() => onSelect?.(value)}>
            {children}
        </button>
    ),
}));

const mockUseRouter = useRouter as jest.Mock;

describe("DocumentsFilters", () => {
    let replace: jest.Mock;

    beforeEach(() => {
        jest.useFakeTimers();
        replace = jest.fn();
        mockUseRouter.mockReturnValue({
            replace,
            push: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
        });
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it("renders the all-statuses default and applies domain/status filters", async () => {
        render(
            <DocumentsFilters
                lens={{ scope: "all" }}
                initialQuery=""
                initialDomain=""
                initialStatuses={[]}
                availableDomains={["Access Management", "Platform Security"]}
            />,
        );

        expect(screen.getAllByText("All statuses").length).toBeGreaterThan(0);

        fireEvent.click(screen.getByText("Access Management"));
        fireEvent.click(screen.getByText("Complete"));
        fireEvent.click(screen.getByRole("button", { name: /apply/i }));

        await waitFor(() => {
            expect(replace).toHaveBeenCalledWith(
                expect.stringContaining("domain=Access+Management"),
            );
        });
        expect(replace).toHaveBeenCalledWith(
            expect.stringContaining("status=complete"),
        );
    });

    it("clears active status selections when all statuses is selected", async () => {
        render(
            <DocumentsFilters
                lens={{ scope: "all" }}
                initialQuery=""
                initialDomain=""
                initialStatuses={["blocked"]}
                availableDomains={["Access Management"]}
            />,
        );

        fireEvent.click(screen.getAllByText("All statuses").at(-1)!);
        fireEvent.click(screen.getByRole("button", { name: /apply/i }));

        await waitFor(() => {
            expect(replace).toHaveBeenCalledWith("/work/documents?scope=all");
        });
    });

    it("debounces search and preserves current domain/status state in the URL", async () => {
        render(
            <DocumentsFilters
                lens={{ scope: "all" }}
                initialQuery=""
                initialDomain="Access Management"
                initialStatuses={["complete"]}
                availableDomains={["Access Management"]}
            />,
        );

        fireEvent.change(screen.getByPlaceholderText("Search documents"), {
            target: { value: "policy" },
        });

        act(() => {
            jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(replace).toHaveBeenCalledWith(
                expect.stringContaining("q=policy"),
            );
        });
        expect(replace).toHaveBeenCalledWith(
            expect.stringContaining("domain=Access+Management"),
        );
        expect(replace).toHaveBeenCalledWith(
            expect.stringContaining("status=complete"),
        );
    });

    it("clears query, domain, and statuses back to the default route state", async () => {
        render(
            <DocumentsFilters
                lens={{ scope: "all" }}
                initialQuery="policy"
                initialDomain="Access Management"
                initialStatuses={["complete"]}
                availableDomains={["Access Management"]}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /clear/i }));

        await waitFor(() => {
            expect(replace).toHaveBeenCalledWith("/work/documents?scope=all");
        });
    });
});
