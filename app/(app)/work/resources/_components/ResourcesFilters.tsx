"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronDown, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { resourceCategoryLabel, resourceCriticalityLabel } from "@/lib/resources/labels";
import type { ResourceCategory, ResourceCriticality } from "@/lib/stubs";
import type { ResourceStatus } from "@/lib/data-source";
import { cn } from "@/lib/utils";

const ALL_VALUE = "all";

type ResourcesFiltersProps = {
    initialQuery: string;
    initialCategories: ResourceCategory[];
    initialCriticalities: ResourceCriticality[];
    initialStatuses: ResourceStatus[];
    availableCategories: ResourceCategory[];
    availableCriticalities: ResourceCriticality[];
};

export function ResourcesFilters({
    initialQuery,
    initialCategories,
    initialCriticalities,
    initialStatuses,
    availableCategories,
    availableCriticalities,
}: ResourcesFiltersProps) {
    const router = useRouter();
    const hasMountedRef = useRef(false);
    const [query, setQuery] = useState(initialQuery);
    const [categories, setCategories] =
        useState<ResourceCategory[]>(initialCategories);
    const [criticalities, setCriticalities] =
        useState<ResourceCriticality[]>(initialCriticalities);
    const [statuses, setStatuses] = useState<ResourceStatus[]>(initialStatuses);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [criticalityOpen, setCriticalityOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const debouncedQuery = useDebouncedValue(query, 250);

    const hasFilters = useMemo(
        () =>
            Boolean(query.trim()) ||
            categories.length > 0 ||
            criticalities.length > 0 ||
            statuses.length > 0,
        [categories.length, criticalities.length, query, statuses.length],
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
        if (nextQuery === initialQuery.trim()) {
            return;
        }

        router.replace(
            buildResourcesIndexHref({
                q: nextQuery || null,
                category: initialCategories.length > 0 ? initialCategories : null,
                criticality:
                    initialCriticalities.length > 0 ? initialCriticalities : null,
                status: initialStatuses.length > 0 ? initialStatuses : null,
                page: null,
            }),
        );
    }, [
        debouncedQuery,
        initialCategories,
        initialCriticalities,
        initialStatuses,
        initialQuery,
        router,
    ]);

    const apply = () => {
        router.replace(
            buildResourcesIndexHref({
                q: query.trim() || null,
                category: categories.length > 0 ? categories : null,
                criticality: criticalities.length > 0 ? criticalities : null,
                status: statuses.length > 0 ? statuses : null,
                page: null,
            }),
        );
    };

    const clear = () => {
        setQuery("");
        setCategories([]);
        setCriticalities([]);
        setStatuses([]);
        router.replace("/work/resources");
    };

    return (
        <div className="flex flex-col justify-between gap-3 lg:flex-row">
            <div className="flex w-full flex-col gap-2 md:flex-row">
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            apply();
                        }
                    }}
                    placeholder="Search resources"
                    className="h-8 w-full"
                />

                <MultiSelectPopover
                    open={categoryOpen}
                    setOpen={setCategoryOpen}
                    allLabel="All categories"
                    label={
                        categories.length > 0
                            ? `${categories.length} categor${categories.length === 1 ? "y" : "ies"}`
                            : "All categories"
                    }
                    options={availableCategories.map((item) => ({
                        value: item,
                        label: resourceCategoryLabel(item),
                    }))}
                    values={categories}
                    onToggle={(value) =>
                        setCategories((current) =>
                            value === ALL_VALUE
                                ? []
                                : current.includes(value as ResourceCategory)
                                ? current.filter((item) => item !== value)
                                : [...current, value as ResourceCategory],
                        )
                    }
                />

                <MultiSelectPopover
                    open={criticalityOpen}
                    setOpen={setCriticalityOpen}
                    allLabel="All criticalities"
                    label={
                        criticalities.length > 0
                            ? `${criticalities.length} criticalit${criticalities.length === 1 ? "y" : "ies"}`
                            : "All criticalities"
                    }
                    options={availableCriticalities.map((item) => ({
                        value: item,
                        label: resourceCriticalityLabel(item),
                    }))}
                    values={criticalities}
                    onToggle={(value) =>
                        setCriticalities((current) =>
                            value === ALL_VALUE
                                ? []
                                : current.includes(value as ResourceCriticality)
                                ? current.filter((item) => item !== value)
                                : [...current, value as ResourceCriticality],
                        )
                    }
                />

                <MultiSelectPopover
                    open={statusOpen}
                    setOpen={setStatusOpen}
                    allLabel="All statuses"
                    label={
                        statuses.length > 0
                            ? `${statuses.length} status${statuses.length === 1 ? "" : "es"}`
                            : "All statuses"
                    }
                    options={[
                        { value: "ready", label: "Ready" },
                        { value: "partial", label: "Partial" },
                        { value: "missing", label: "Missing" },
                        { value: "unknown", label: "Unknown" },
                    ]}
                    values={statuses}
                    onToggle={(value) =>
                        setStatuses((current) =>
                            value === ALL_VALUE
                                ? []
                                : current.includes(value as ResourceStatus)
                                  ? current.filter((item) => item !== value)
                                  : [...current, value as ResourceStatus],
                        )
                    }
                />
            </div>

            <div className="flex gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={clear}
                    disabled={!hasFilters}
                >
                    Clear
                    <RefreshCcw className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={apply}
                >
                    Apply
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

function buildResourcesIndexHref(params: {
    q?: string | null;
    category?: string[] | null;
    criticality?: string[] | null;
    status?: string[] | null;
    sortBy?: string | null;
    sortDir?: string | null;
    page?: string | null;
}) {
    const searchParams = new URLSearchParams();

    appendParam(searchParams, "q", params.q);
    appendParams(searchParams, "category", params.category);
    appendParams(searchParams, "criticality", params.criticality);
    appendParams(searchParams, "status", params.status);
    appendParam(searchParams, "sortBy", params.sortBy);
    appendParam(searchParams, "sortDir", params.sortDir);
    appendParam(searchParams, "page", params.page);

    const query = searchParams.toString();
    return query ? `/work/resources?${query}` : "/work/resources";
}

function appendParam(
    searchParams: URLSearchParams,
    key: string,
    value?: string | null,
) {
    if (value) {
        searchParams.set(key, value);
    }
}

function appendParams(
    searchParams: URLSearchParams,
    key: string,
    values?: string[] | null,
) {
    if (!values) return;

    for (const value of values) {
        searchParams.append(key, value);
    }
}

type MultiSelectPopoverProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    allLabel: string;
    label: string;
    options: Array<{ value: string; label: string }>;
    values: string[];
    onToggle: (value: string) => void;
};

function MultiSelectPopover({
    open,
    setOpen,
    allLabel,
    label,
    options,
    values,
    onToggle,
}: MultiSelectPopoverProps) {
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-auto justify-between">
                    <span className="truncate">{label}</span>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-0">
                <Command>
                    <CommandList>
                        <CommandGroup>
                            <CommandItem
                                value="all"
                                onSelect={() => onToggle(ALL_VALUE)}
                            >
                                <Check
                                    className={cn(
                                        "h-4 w-4",
                                        values.length === 0
                                            ? "opacity-100"
                                            : "opacity-0",
                                    )}
                                />
                                {allLabel}
                            </CommandItem>
                            {options.map((option) => {
                                const active = values.includes(option.value);

                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => onToggle(option.value)}
                                    >
                                        <Check
                                            className={cn(
                                                "h-4 w-4",
                                                active ? "opacity-100" : "opacity-0",
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
    );
}
