import { render, screen } from "@testing-library/react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/static/AppHeader";
import { useAppSidebar } from "@/components/static/AppSidebarProvider";

jest.mock("next/navigation", () => ({
    usePathname: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock("@/components/static/AppSidebarProvider", () => ({
    useAppSidebar: jest.fn(),
}));

jest.mock("@/components/lens/LensDialogControl", () => ({
    UrlLensDialogControl: () => (
        <button type="button">Scope lens</button>
    ),
}));

jest.mock("next/link", () => {
    return function MockLink({
        href,
        children,
        ...props
    }: {
        href: string;
        children: ReactNode;
    }) {
        return (
            <a href={href} {...props}>
                {children}
            </a>
        );
    };
});

const mockUsePathname = usePathname as jest.Mock;
const mockUseSearchParams = useSearchParams as jest.Mock;
const mockUseAppSidebar = useAppSidebar as jest.Mock;

describe("AppHeader", () => {
    beforeEach(() => {
        mockUsePathname.mockReset();
        mockUseSearchParams.mockReset();
        mockUseAppSidebar.mockReset();
        mockUsePathname.mockReturnValue("/tasks");
        mockUseAppSidebar.mockReturnValue({
            isOpen: false,
            setIsOpen: jest.fn(),
            toggle: jest.fn(),
        });
    });

    it("renders fallback when route hooks are suspended", () => {
        mockUseSearchParams.mockImplementation(() => {
            throw new Promise(() => {});
        });

        const { container } = render(<AppHeader />);

        expect(screen.queryByRole("link")).not.toBeInTheDocument();
        expect(container.querySelectorAll("[aria-hidden]").length).toBeGreaterThan(0);
    });

    it("renders hydrated breadcrumbs and preserves lens params in links", () => {
        mockUsePathname.mockReturnValue("/tasks/fresh-task-1");
        mockUseSearchParams.mockReturnValue(
            new URLSearchParams("aspect=work"),
        );

        render(<AppHeader />);

        const homeLink = screen.getByRole("link", { name: /home/i });
        expect(homeLink).toHaveAttribute("href", "/tasks?aspect=work");
        expect(
            screen.getByRole("button", { name: /scope lens/i }),
        ).toBeInTheDocument();
        expect(screen.getByText("fresh-task-1")).toBeInTheDocument();
    });
});
