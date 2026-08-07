"use client";

import { Suspense } from "react";
import { Menu, User, HomeIcon, LogOut } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UrlLensDialogControl } from "@/components/lens/LensDialogControl";
import { useAppSidebar } from "./AppSidebarProvider";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseLens, withLens } from "@/lib/lens";

interface BreadcrumbCrumb {
    label: string;
    href: string;
}

const ROUTE_MAP: Record<string, string> = {
    timeline: "Timeline",
    captures: "Captures",
    events: "Events",
    reminders: "Reminders",
    tasks: "Tasks",
    records: "Records",
    resources: "Resources",
    goals: "Goals",
    money: "Money",
    settings: "Settings",
};

const DETAIL_PARENT_LABELS: Record<string, string> = {
    captures: "Captures",
    tasks: "Tasks",
    records: "Records",
    resources: "Resources",
};

export function getBreadcrumbParent(
    pathname: string,
): BreadcrumbCrumb | null {
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0 || segments[0] === "timeline") {
        return null;
    }

    if (segments.length === 1) {
        return { label: "Timeline", href: "/timeline" };
    }

    const parentSegments = segments.slice(0, -1);
    const parentSegment = parentSegments[parentSegments.length - 1];
    const parentPath = `/${parentSegments.join("/")}`;
    const label =
        ROUTE_MAP[parentSegment.toLowerCase()] ??
        DETAIL_PARENT_LABELS[parentSegment] ??
        parentSegment;

    return { label, href: parentPath };
}

function AppHeaderInner() {
    const { toggle } = useAppSidebar();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const lens = parseLens(searchParams);
    const parentCrumb = getBreadcrumbParent(pathname);
    const homeHref = withLens("/timeline", lens);

    return (
        <header className="h-16 lg:h-20 w-full px-[4px] lg:px-[12px] 2xl:px-6">
            <div className="grid h-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
                <div className="flex min-w-0 items-center gap-2 justify-self-start">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="2xl:hidden shrink-0"
                        onClick={toggle}
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="h-4 w-4" />
                    </Button>

                    <Breadcrumb className="hidden lg:block">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link
                                        href={homeHref}
                                        className="flex items-center gap-1.5"
                                    >
                                        <HomeIcon className="h-4 w-4" />
                                        <span className="sr-only">Home</span>
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>

                            {parentCrumb && (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild>
                                            <Link
                                                href={withLens(
                                                    parentCrumb.href,
                                                    lens,
                                                )}
                                            >
                                                {parentCrumb.label}
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </>
                            )}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div className="justify-self-center shrink-0">
                    <UrlLensDialogControl />
                </div>

                <div className="flex shrink-0 items-center gap-2 justify-self-end">

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="User menu"
                                title="User account"
                            >
                                <User className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <a href="/auth/logout" className="cursor-pointer">
                                    <LogOut className="h-4 w-4" />
                                    Sign out
                                </a>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}

function AppHeaderFallback() {
    return (
        <header className="h-16 lg:h-20 w-full px-[4px] lg:px-[12px] 2xl:px-6">
            <div className="grid h-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
                <div
                    className="h-9 w-64 rounded-md bg-muted/50 animate-pulse justify-self-start"
                    aria-hidden
                />
                <div
                    className="h-9 w-32 rounded-md bg-muted/50 animate-pulse justify-self-center"
                    aria-hidden
                />
                <div className="flex items-center gap-2 justify-self-end">
                    <div className="h-9 w-9 rounded-md bg-muted/50 animate-pulse" aria-hidden />
                    <div className="h-9 w-9 rounded-md bg-muted/50 animate-pulse" aria-hidden />
                </div>
            </div>
        </header>
    );
}

export function AppHeader() {
    return (
        <Suspense fallback={<AppHeaderFallback />}>
            <AppHeaderInner />
        </Suspense>
    );
}
