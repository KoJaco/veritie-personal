"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { withLens, type ScopeLens } from "@/lib/lens";
import type { ObjectCoverageStatus } from "@/lib/stubs";
import { cn } from "@/lib/utils";

const STATUS_ALL_VALUE = "all";

const STATUS_OPTIONS: Array<{
    value: ObjectCoverageStatus | typeof STATUS_ALL_VALUE;
    label: string;
}> = [
    { value: STATUS_ALL_VALUE, label: "All statuses" },
    { value: "complete", label: "Complete" },
    { value: "blocked", label: "Blocked" },
    { value: "at_risk", label: "At risk" },
    { value: "unmapped", label: "Unmapped" },
];

type DocumentsFiltersProps = {
    lens: ScopeLens;
    initialQuery: string;
    initialDomain: string;
    initialStatuses: ObjectCoverageStatus[];
    availableDomains: string[];
};

export function DocumentsFilters({
    lens,
    initialQuery,
    initialDomain,
    initialStatuses,
    availableDomains,
}: DocumentsFiltersProps) {
    const router = useRouter();
    const hasMountedRef = useRef(false);
    const [query, setQuery] = useState(initialQuery);
    const [domain, setDomain] = useState(initialDomain);
    const [statuses, setStatuses] =
        useState<ObjectCoverageStatus[]>(initialStatuses);
    const [domainOpen, setDomainOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const debouncedQuery = useDebouncedValue(query, 250);

    const hasFilters = useMemo(
        () => Boolean(query.trim()) || Boolean(domain) || statuses.length > 0,
        [domain, query, statuses],
    );

    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        const nextQuery = debouncedQuery.trim();
        const currentQuery = initialQuery.trim();

        if (nextQuery === currentQuery) {
            return;
        }

        router.replace(
            withLens("/records", lens, {
                q: nextQuery ? nextQuery : null,
                domain: initialDomain || null,
                status: initialStatuses.length > 0 ? initialStatuses : null,
                page: null,
            }),
        );
    }, [
        debouncedQuery,
        initialDomain,
        initialQuery,
        initialStatuses,
        lens,
        router,
    ]);

    const apply = () => {
        router.replace(
            withLens("/records", lens, {
                q: query.trim() ? query.trim() : null,
                domain: domain || null,
                status: statuses.length > 0 ? statuses : null,
                page: null,
            }),
        );
    };

    const clear = () => {
        setQuery("");
        setDomain("");
        setStatuses([]);
        router.replace(withLens("/records", lens));
    };

    const toggleStatus = (value: ObjectCoverageStatus) => {
        setStatuses((current) =>
            current.includes(value)
                ? current.filter((status) => status !== value)
                : [...current, value],
        );
    };

    return (
        <div className="flex flex-col justify-between gap-3 lg:flex-row">
            <div className="flex flex-col gap-2 md:flex-row w-full">
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            apply();
                        }
                    }}
                    placeholder="Search documents"
                    className="h-8 w-full flex"
                />
                <Popover open={domainOpen} onOpenChange={setDomainOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-auto justify-between"
                        >
                            <span className="truncate">
                                {domain || "All domains"}
                            </span>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="min-w-60 p-0">
                        <Command>
                            <CommandInput placeholder="Search domain" />
                            <CommandList className="min-w-60">
                                <CommandEmpty>No domain found.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem
                                        value="all-domains"
                                        onSelect={() => {
                                            setDomain("");
                                            setDomainOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "h-4 w-4",
                                                domain
                                                    ? "opacity-0"
                                                    : "opacity-100",
                                            )}
                                        />
                                        All domains
                                    </CommandItem>
                                    {availableDomains.map((option) => (
                                        <CommandItem
                                            key={option}
                                            value={option}
                                            onSelect={() => {
                                                setDomain(option);
                                                setDomainOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "h-4 w-4",
                                                    domain === option
                                                        ? "opacity-100"
                                                        : "opacity-0",
                                                )}
                                            />
                                            {option}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-auto justify-between"
                        >
                            <span className="truncate">
                                {statuses.length > 0
                                    ? `${statuses.length} status${statuses.length === 1 ? "" : "es"} selected`
                                    : "All statuses"}
                            </span>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                        <Command>
                            <CommandList>
                                <CommandGroup>
                                    {STATUS_OPTIONS.map((option) => {
                                        const active =
                                            option.value === STATUS_ALL_VALUE
                                                ? statuses.length === 0
                                                : statuses.includes(
                                                      option.value,
                                                  );

                                        return (
                                            <CommandItem
                                                key={option.value}
                                                value={option.label}
                                                onSelect={() => {
                                                    if (
                                                        option.value ===
                                                        STATUS_ALL_VALUE
                                                    ) {
                                                        setStatuses([]);
                                                        return;
                                                    }

                                                    toggleStatus(option.value);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "h-4 w-4 text-primary",
                                                        active
                                                            ? "opacity-100"
                                                            : "opacity-0",
                                                    )}
                                                />
                                                {option.label}
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={clear}
                    disabled={!hasFilters}
                >
                    Clear
                    <RefreshCcw />
                </Button>
                <Button size="sm" onClick={apply}>
                    Apply
                    <Check />
                </Button>
            </div>
        </div>
    );
}
