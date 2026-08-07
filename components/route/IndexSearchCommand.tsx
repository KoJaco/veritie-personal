"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { PageHeaderActionButton } from "@/components/route/PageHeaderActionButton";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { buildIndexHref } from "@/lib/route/build-index-href";

export type IndexSearchCommandItem = {
    id: string;
    title: string;
    summary?: string;
    searchTerms?: string[];
};

type IndexSearchCommandProps = {
    route: string;
    search?: string;
    baseParams: Record<string, string | undefined>;
    items: IndexSearchCommandItem[];
    dialogTitle: string;
    dialogDescription: string;
    placeholder: string;
    searchParamKey?: string;
    recentHeading?: string;
    matchingHeading?: string;
    matchesQuery?: (item: IndexSearchCommandItem, query: string) => boolean;
    /** When false, suppresses empty-state copy until suggestions have loaded. */
    suggestionsReady?: boolean;
};

function defaultMatchesQuery(item: IndexSearchCommandItem, query: string) {
    const lower = query.toLowerCase();
    return (
        item.title.toLowerCase().includes(lower) ||
        (item.summary?.toLowerCase().includes(lower) ?? false) ||
        item.searchTerms?.some((term) => term.toLowerCase().includes(lower)) ===
            true
    );
}

export function IndexSearchCommand({
    route,
    search,
    baseParams,
    items,
    dialogTitle,
    dialogDescription,
    placeholder,
    searchParamKey = "q",
    recentHeading = "Recent",
    matchingHeading = "Matching",
    matchesQuery = defaultMatchesQuery,
    suggestionsReady = true,
}: IndexSearchCommandProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(search ?? "");

    const filteredItems = useMemo(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            return items.slice(0, 10);
        }
        return items
            .filter((item) => matchesQuery(item, trimmed))
            .slice(0, 12);
    }, [items, matchesQuery, query]);

    const applySearch = (value: string) => {
        const href = buildIndexHref(route, baseParams, {
            [searchParamKey]: value.trim() || undefined,
        });
        router.push(href);
        setOpen(false);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (nextOpen) {
            setQuery(search ?? "");
        }
    };

    return (
        <>
            <PageHeaderActionButton
                icon={Search}
                label="Search"
                onClick={() => handleOpenChange(true)}
            />
            <CommandDialog
                open={open}
                onOpenChange={handleOpenChange}
                title={dialogTitle}
                description={dialogDescription}
                shouldFilter={false}
            >
                <CommandInput
                    placeholder={placeholder}
                    value={query}
                    onValueChange={setQuery}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            applySearch(query);
                        }
                    }}
                />
                <CommandList>
                    {suggestionsReady && (
                        <CommandEmpty>No results found.</CommandEmpty>
                    )}
                    {query.trim().length > 0 && (
                        <CommandGroup heading="Search">
                            <CommandItem
                                value={`search-${query}`}
                                onSelect={() => applySearch(query)}
                            >
                                Search for &ldquo;{query.trim()}&rdquo;
                            </CommandItem>
                        </CommandGroup>
                    )}
                    {filteredItems.length > 0 && (
                        <CommandGroup
                            heading={
                                query.trim() ? matchingHeading : recentHeading
                            }
                        >
                            {filteredItems.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    value={`${item.id}-${item.title}`}
                                    onSelect={() => applySearch(item.title)}
                                    className="flex-col items-start gap-0.5"
                                >
                                    <span className="font-medium">
                                        {item.title}
                                    </span>
                                    {item.summary && (
                                        <span className="text-xs text-muted-foreground">
                                            {item.summary}
                                        </span>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
