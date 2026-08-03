import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type IndexPaginationProps = {
    currentPage: number;
    totalPages: number;
    rangeStart: number;
    rangeEnd: number;
    totalItems: number;
    hrefForPage: (page: number) => string;
    className?: string;
};

export function IndexPagination({
    currentPage,
    totalPages,
    rangeStart,
    rangeEnd,
    totalItems,
    hrefForPage,
    className,
}: IndexPaginationProps) {
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
    const summary =
        totalItems === 0
            ? "Showing 0 of 0"
            : `Showing ${rangeStart}-${rangeEnd} of ${totalItems}`;

    return (
        <div
            className={cn(
                "flex flex-col gap-3 border-t px-0.5 py-3 sm:flex-row sm:items-center sm:justify-between",
                className,
            )}
        >
            <div className="flex flex-wrap items-center gap-1.5">
                <Button
                    asChild
                    variant={null}
                    size="sm"
                    disabled={currentPage <= 1}
                >
                    <Link
                        href={hrefForPage(Math.max(1, currentPage - 1))}
                        aria-label="Go to previous page"
                    >
                        <ChevronLeft />
                        Prev
                    </Link>
                </Button>
                {pages.map((page) => {
                    const active = page === currentPage;

                    return (
                        <Button
                            key={page}
                            asChild
                            variant={active ? "default" : "ghost"}
                            size="sm"
                            className="rounded-full"
                        >
                            <Link
                                href={hrefForPage(page)}
                                aria-current={active ? "page" : undefined}
                                aria-label={`Go to page ${page}`}
                            >
                                {page}
                            </Link>
                        </Button>
                    );
                })}
                <Button
                    asChild
                    variant={null}
                    size="sm"
                    disabled={currentPage >= totalPages}
                >
                    <Link
                        href={hrefForPage(
                            Math.min(totalPages, currentPage + 1),
                        )}
                        aria-label="Go to next page"
                    >
                        Next
                        <ChevronRight />
                    </Link>
                </Button>
                <p className="text-sm text-muted-foreground">{summary}</p>
            </div>
        </div>
    );
}
