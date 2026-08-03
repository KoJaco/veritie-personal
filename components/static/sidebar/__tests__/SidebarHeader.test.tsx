import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { SidebarHeader } from "@/components/static/sidebar/SidebarHeader";

jest.mock("next/navigation", () => ({
    useSearchParams: jest.fn(),
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

const mockUseSearchParams = useSearchParams as jest.Mock;

describe("SidebarHeader", () => {
    beforeEach(() => {
        mockUseSearchParams.mockReset();
    });

    it("renders fallback when route hooks are suspended", () => {
        mockUseSearchParams.mockImplementation(() => {
            throw new Promise(() => {});
        });

        const { container } = render(
            <SidebarHeader className="sidebar-header-fallback-sentinel" />,
        );

        expect(
            container.querySelector(".sidebar-header-fallback-sentinel"),
        ).toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("renders hydrated link and preserves lens params", () => {
        mockUseSearchParams.mockReturnValue(
            new URLSearchParams("scope=operations-readiness"),
        );

        render(<SidebarHeader />);

        const link = screen.getByRole("link", { name: /shell/i });
        expect(link).toHaveAttribute(
            "href",
            "/work?scope=operations-readiness",
        );
    });
});
