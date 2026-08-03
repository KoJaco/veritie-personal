import { fireEvent, render, screen } from "@testing-library/react";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { toast } from "sonner";

jest.mock("sonner", () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock("@/lib/hooks/useIsMobileViewport", () => ({
    useIsMobileViewport: jest.fn(() => false),
}));

jest.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/drawer", () => ({
    Drawer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/select", () => ({
    Select: ({
        children,
        value,
        onValueChange,
    }: {
        children: React.ReactNode;
        value?: string;
        onValueChange?: (value: string) => void;
    }) => (
        <select
            value={value}
            onChange={(event) => onValueChange?.(event.target.value)}
        >
            {children}
        </select>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => <option value="">{placeholder}</option>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectItem: ({
        children,
        value,
    }: {
        children: React.ReactNode;
        value: string;
    }) => <option value={value}>{children}</option>,
}));

describe("CreateTaskDialog", () => {
    const props = {
        checks: [{ id: "control-1", label: "Access review check" }],
        owners: [{ id: "user_current", label: "You" }],
        resources: [{ id: "asset-1", label: "Identity Platform" }],
    };

    it("validates required fields before showing stub success", () => {
        render(<CreateTaskDialog {...props} />);

        fireEvent.click(
            screen.getAllByRole("button", { name: /create task/i }).at(-1)!,
        );

        expect(toast.error).toHaveBeenCalled();
    });

    it("submits with stubbed success feedback once required fields are set", () => {
        render(<CreateTaskDialog {...props} />);

        fireEvent.change(screen.getByLabelText("Title"), {
            target: { value: "Validate privileged access pack" },
        });
        fireEvent.change(screen.getAllByRole("combobox")[0], {
            target: { value: "control-1" },
        });
        fireEvent.change(screen.getAllByRole("combobox")[1], {
            target: { value: "user_current" },
        });
        fireEvent.click(
            screen.getAllByRole("button", { name: /create task/i }).at(-1)!,
        );

        expect(toast.success).toHaveBeenCalled();
    });
});
