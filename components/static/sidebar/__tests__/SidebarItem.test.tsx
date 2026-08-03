/// <reference types="jest" />
import { render, screen } from "@testing-library/react";
import type { LucideIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode, SVGProps } from "react";
import { SidebarItem } from "@/components/static/sidebar/SidebarItem";

jest.mock("next/navigation", () => ({
    usePathname: jest.fn(),
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

const mockUsePathname = usePathname as jest.Mock;
const mockUseSearchParams = useSearchParams as jest.Mock;

const DummyIcon = ((props: SVGProps<SVGSVGElement>) => (
    <svg {...props} />
)) as LucideIcon;

describe("SidebarItem Suspense boundary", () => {
    beforeEach(() => {
        mockUsePathname.mockReset();
        mockUseSearchParams.mockReset();
    });

    it("renders fallback when route hooks are suspended", () => {
        mockUsePathname.mockReturnValue("/work/tasks");
        mockUseSearchParams.mockImplementation(() => {
            throw new Promise(() => {});
        });

        const { container } = render(
            <SidebarItem
                href="/work/tasks"
                icon={DummyIcon}
                label="Tasks"
                className="suspense-fallback-sentinel"
            />,
        );

        expect(
            container.querySelector(".suspense-fallback-sentinel"),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("link", {
                name: "Tasks",
            }),
        ).not.toBeInTheDocument();
    });

    it("renders the link once route hooks resolve", () => {
        mockUsePathname.mockReturnValue("/work/tasks");
        mockUseSearchParams.mockReturnValue(
            new URLSearchParams("scope=operations-readiness"),
        );

        render(
            <SidebarItem
                href="/work/tasks"
                icon={DummyIcon}
                label="Tasks"
            />,
        );

        const link = screen.getByRole("link", { name: "Tasks" });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute(
            "href",
            "/work/tasks?scope=operations-readiness",
        );
    });
});
