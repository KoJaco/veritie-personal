"use client";

import { Suspense } from "react";
import { Menu, Bell, User, HomeIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UrlLensDialogControl } from "@/components/lens/LensDialogControl";
import { useAppSidebar } from "./AppSidebarProvider";
import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
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
    work: "Work",
    resources: "Resources",
    documents: "Documents",
    scopes: "Scopes",
    checks: "Checks",
    connections: "Connections",
    settings: "Settings",
    tasks: "Tasks",
};

function buildBreadcrumbs(pathname: string): BreadcrumbCrumb[] {
    const segments = pathname.split("/").filter(Boolean);
    const workIndex = segments.indexOf("work");

    if (workIndex === -1) {
        return [{ label: "Work", href: "/work" }];
    }

    const crumbs: BreadcrumbCrumb[] = [{ label: "Work", href: "/work" }];
    const afterWork = segments.slice(workIndex + 1);

    afterWork.forEach((segment, index) => {
        const path = `/work/${afterWork.slice(0, index + 1).join("/")}`;
        const label = ROUTE_MAP[segment.toLowerCase()] || segment;
        crumbs.push({ label, href: path });
    });

    return crumbs;
}

function AppHeaderInner() {
    const { toggle } = useAppSidebar();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const lens = parseLens(searchParams);
    const crumbs = buildBreadcrumbs(pathname);
    const shouldCollapse = crumbs.length > 3;
    const firstCrumb = crumbs[0];
    const lastCrumb = crumbs[crumbs.length - 1];
    const middleCrumbs = crumbs.slice(1, -1);

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

                    <Breadcrumb className="hidden sm:block">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                {crumbs.length === 1 ? (
                                    <BreadcrumbPage className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Work
                                        </span>
                                        <span className="sr-only">Work</span>
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link
                                            href={withLens(firstCrumb.href, lens)}
                                            className="flex items-center gap-1.5"
                                        >
                                            <HomeIcon className="h-4 w-4" />
                                            <span className="sr-only">Work</span>
                                        </Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>

                            {middleCrumbs.length > 0 && (
                                <>
                                    <BreadcrumbSeparator />
                                    {shouldCollapse ? (
                                        <BreadcrumbItem>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <BreadcrumbEllipsis />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    {middleCrumbs.map((crumb) => (
                                                        <DropdownMenuItem key={crumb.href} asChild>
                                                            <Link href={withLens(crumb.href, lens)}>
                                                                {crumb.label}
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </BreadcrumbItem>
                                    ) : (
                                        middleCrumbs.map((crumb) => (
                                            <BreadcrumbItem key={crumb.href}>
                                                <BreadcrumbLink asChild>
                                                    <Link href={withLens(crumb.href, lens)}>
                                                        {crumb.label}
                                                    </Link>
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                        ))
                                    )}
                                </>
                            )}

                            {crumbs.length > 1 && (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>{lastCrumb.label}</BreadcrumbPage>
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
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Notifications"
                        title="Notifications"
                    >
                        <Bell className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="User menu"
                        title="User Account"
                    >
                        <User className="h-4 w-4" />
                    </Button>
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
