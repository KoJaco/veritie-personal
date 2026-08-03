import { fireEvent, render, screen } from "@testing-library/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UrlLensDialogControl } from "@/components/lens/LensDialogControl";
import { useIsMobileViewport } from "@/lib/hooks/useIsMobileViewport";

jest.mock("next/navigation", () => ({
    usePathname: jest.fn(),
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock("@/lib/hooks/useIsMobileViewport", () => ({
    useIsMobileViewport: jest.fn(),
}));

const mockUsePathname = usePathname as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseSearchParams = useSearchParams as jest.Mock;
const mockUseIsMobileViewport = useIsMobileViewport as jest.Mock;

describe("UrlLensDialogControl", () => {
    let replace: jest.Mock;
    let prefetch: jest.Mock;

    beforeEach(() => {
        mockUsePathname.mockReset();
        mockUseRouter.mockReset();
        mockUseSearchParams.mockReset();
        mockUseIsMobileViewport.mockReset();
        replace = jest.fn();
        prefetch = jest.fn();

        mockUsePathname.mockReturnValue("/tasks");
        mockUseRouter.mockReturnValue({
            replace,
            push: jest.fn(),
            prefetch,
            back: jest.fn(),
        });
        mockUseIsMobileViewport.mockReturnValue(false);
    });

    it("renders fallback when route hooks are suspended", () => {
        mockUseSearchParams.mockImplementation(() => {
            throw new Promise(() => {});
        });

        render(<UrlLensDialogControl />);

        expect(
            screen.queryByRole("button", { name: /scope/i }),
        ).not.toBeInTheDocument();
    });

    it("renders hydrated lens control when route hooks resolve", () => {
        mockUseSearchParams.mockReturnValue(
            new URLSearchParams("aspect=work"),
        );

        render(<UrlLensDialogControl />);

        expect(
            screen.getByRole("button", { name: /scope/i }),
        ).toBeInTheDocument();
    });

    it("opens dialog, cancels without replacing URL, and closes", () => {
        mockUseSearchParams.mockReturnValue(
            new URLSearchParams("aspect=work&focus=open"),
        );

        render(<UrlLensDialogControl />);

        fireEvent.click(screen.getByRole("button", { name: /scope/i }));
        expect(screen.getByText("Choose scope")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(replace).not.toHaveBeenCalled();
        expect(screen.queryByText("Choose scope")).not.toBeInTheDocument();
    });

    it("applies selected lens and preserves non-lens query params", () => {
        mockUseSearchParams.mockReturnValue(
            new URLSearchParams("aspect=work&focus=open"),
        );

        render(<UrlLensDialogControl />);

        fireEvent.click(screen.getByRole("button", { name: /scope/i }));
        fireEvent.click(
            screen.getByRole("button", { name: /Finance/i }),
        );
        fireEvent.click(screen.getByRole("button", { name: "Apply scope" }));

        expect(replace).toHaveBeenCalledTimes(1);
        expect(prefetch).not.toHaveBeenCalled();
        const href = replace.mock.calls[0][0] as string;
        expect(href).toContain("/tasks?");
        expect(href).toContain("aspect=finance");
        expect(href).toContain("focus=open");
    });

    it("uses mobile drawer variant and applies lens with router replace", () => {
        mockUseIsMobileViewport.mockReturnValue(true);
        mockUseSearchParams.mockReturnValue(
            new URLSearchParams("aspect=work&focus=open"),
        );

        render(<UrlLensDialogControl />);

        fireEvent.click(screen.getByRole("button", { name: /scope/i }));
        expect(screen.getByText("Choose scope")).toBeInTheDocument();
        fireEvent.click(
            screen.getByRole("button", { name: /Personal/i }),
        );
        fireEvent.click(screen.getByRole("button", { name: "Apply scope" }));

        expect(replace).toHaveBeenCalledTimes(1);
        expect(prefetch).not.toHaveBeenCalled();
        const href = replace.mock.calls[0][0] as string;
        expect(href).toContain("aspect=personal");
    });

    it("fails closed safely for invalid lens query input", () => {
        mockUseSearchParams.mockReturnValue(
            new URLSearchParams("aspect=NOT_REAL"),
        );

        const { rerender } = render(<UrlLensDialogControl />);

        expect(
            screen.getByRole("button", { name: /scope/i }),
        ).toBeInTheDocument();

        rerender(<UrlLensDialogControl />);
        expect(screen.getByRole("button", { name: /scope/i })).toBeInTheDocument();
    });

    it("fails closed when lens input is oversized", () => {
        const oversized = "x".repeat(400);
        mockUseSearchParams.mockReturnValue(
            new URLSearchParams(`aspect=${oversized}`),
        );

        render(<UrlLensDialogControl />);

        expect(
            screen.getByRole("button", { name: /scope/i }),
        ).toBeInTheDocument();
    });
});
