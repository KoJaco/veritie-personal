import { fireEvent, render, screen } from "@testing-library/react";
import { AttachmentUploadFlow } from "@/components/attachments/AttachmentUploadFlow";

const refresh = jest.fn();
const mockUseIsMobileViewport = jest.fn(() => false);
const mockDropzoneOpen = jest.fn();

jest.mock("next/navigation", () => ({
    useRouter: () => ({ refresh }),
}));

jest.mock("@/lib/hooks/useIsMobileViewport", () => ({
    useIsMobileViewport: () => mockUseIsMobileViewport(),
}));

jest.mock("react-dropzone", () => ({
    useDropzone: ({ onDrop }: { onDrop: (files: File[]) => void }) => {
        mockDropzoneOpen.mockImplementation(() => {
            onDrop([
                new File(["hello"], "attachment.pdf", {
                    type: "application/pdf",
                }),
            ]);
        });

        return {
            getRootProps: () => ({ onClick: jest.fn() }),
            getInputProps: () => ({}),
            isDragActive: false,
            open: mockDropzoneOpen,
        };
    },
}));

jest.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="dialog-shell">{children}</div>
    ),
    DialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
        asChild ? children : <div>{children}</div>,
    DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/drawer", () => ({
    Drawer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-shell">{children}</div>
    ),
    DrawerTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
        asChild ? children : <div>{children}</div>,
    DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/popover", () => ({
    Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PopoverTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
        asChild ? children : <div>{children}</div>,
    PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/button", () => ({
    Button: ({
        children,
        onClick,
        disabled,
    }: {
        children: React.ReactNode;
        onClick?: () => void;
        disabled?: boolean;
    }) => (
        <button type="button" onClick={onClick} disabled={disabled}>
            {children}
        </button>
    ),
}));

jest.mock("@/components/ui/input", () => ({
    Input: ({
        value,
        onChange,
        placeholder,
    }: {
        value?: string;
        onChange?: (event: { target: { value: string } }) => void;
        placeholder?: string;
    }) => (
        <input
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange?.(event as never)}
        />
    ),
}));

jest.mock("@/components/ui/select", () => ({
    Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

jest.mock("@/components/ui/calendar", () => ({
    Calendar: () => <div>Calendar</div>,
}));

describe("AttachmentUploadFlow", () => {
    beforeEach(() => {
        refresh.mockReset();
        mockUseIsMobileViewport.mockReturnValue(false);
    });

    it("uses dialog shell on desktop and renders the library review target", async () => {
        render(
            <AttachmentUploadFlow context={{ kind: "library" }} />,
        );

        expect(screen.getByTestId("dialog-shell")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /select file/i }));
        fireEvent.click(screen.getAllByRole("button", { name: /^Next$/i })[0]);
        fireEvent.click(screen.getAllByRole("button", { name: /^Next$/i })[0]);

        expect(screen.getByText("Library (unattached)")).toBeInTheDocument();
        expect(
            screen.getByText("No relation (unattached attachment)"),
        ).toBeInTheDocument();
    });

    it("uses drawer shell on mobile and renders task attach target", async () => {
        mockUseIsMobileViewport.mockReturnValue(true);

        render(
            <AttachmentUploadFlow
                context={{
                    kind: "task",
                    taskId: "task_1",
                    taskTitle: "Complete Risk Assessment",
                }}
            />,
        );

        expect(screen.getByTestId("drawer-shell")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /select file/i }));
        fireEvent.click(screen.getAllByRole("button", { name: /^Next$/i })[0]);
        fireEvent.click(screen.getAllByRole("button", { name: /^Next$/i })[0]);

        expect(screen.getByText("Task: Complete Risk Assessment")).toBeInTheDocument();
    });

    it("renders object attach target in review step", async () => {
        render(
            <AttachmentUploadFlow
                context={{
                    kind: "object",
                    objectId: "obj_1",
                    objectTitle: "Access Control Policy",
                }}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /select file/i }));
        fireEvent.click(screen.getAllByRole("button", { name: /^Next$/i })[0]);
        fireEvent.click(screen.getAllByRole("button", { name: /^Next$/i })[0]);

        expect(screen.getByText("Object: Access Control Policy")).toBeInTheDocument();
    });

    it("renders the revision-specific review state for an existing attachment root", async () => {
        render(
            <AttachmentUploadFlow
                context={{
                    kind: "attachment",
                    attachmentId: "ev_42",
                    attachmentTitle: "Quarterly access review",
                }}
                triggerLabel="New version"
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /select file/i }));
        fireEvent.click(screen.getAllByRole("button", { name: /^Next$/i })[0]);
        fireEvent.click(screen.getAllByRole("button", { name: /^Next$/i })[0]);

        expect(
            screen.getByText("Attachment: Quarterly access review"),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /appends a new immutable version to the existing attachment root/i,
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /upload new version/i }),
        ).toBeInTheDocument();
    });
});
