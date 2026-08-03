"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import type {
    TaskIndexSegment,
    TaskIndexSummaryReadModel,
    TaskOwnerSummaryReadModel,
    TaskUiStatus,
} from "@/lib/data-source";
import { withLens, type ScopeLens } from "@/lib/lens";
import { cn } from "@/lib/utils";
import {
    AlertTriangle,
    Boxes,
    Check,
    CheckCircle2,
    ChevronDown,
    Circle,
    Clock3,
    ListFilter,
    PauseCircle,
    RefreshCcw,
    UserRound,
    Waypoints,
} from "lucide-react";

type Option = {
    id: string;
    label: string;
};

type TaskFilterToolbarProps = {
    lens: ScopeLens;
    initialSegment: TaskIndexSegment;
    initialStatuses: TaskUiStatus[];
    initialOwnerIds: string[];
    initialCheckIds: string[];
    initialResourceIds: string[];
    ownerOptions: TaskOwnerSummaryReadModel[];
    checkOptions: Option[];
    resourceOptions: Option[];
    currentParams: Record<string, string | string[] | null>;
    summary: TaskIndexSummaryReadModel;
};

const STATUS_OPTIONS: Array<{
    value: TaskUiStatus;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}> = [
    { value: "open", label: "Open", icon: Clock3 },
    { value: "in_progress", label: "In progress", icon: PauseCircle },
    { value: "blocked", label: "Blocked", icon: AlertTriangle },
    { value: "completed", label: "Completed", icon: CheckCircle2 },
];

const SEGMENTS: Array<{
    key: TaskIndexSegment;
    label: string;
    countFrom: (summary: TaskIndexSummaryReadModel) => number;
}> = [
    {
        key: "all",
        label: "All",
        countFrom: (summary) => summary.open + summary.completed,
    },
    { key: "mine", label: "My tasks", countFrom: (summary) => summary.open },
    {
        key: "dueSoon",
        label: "Due soon",
        countFrom: (summary) => summary.dueSoon,
    },
    {
        key: "overdue",
        label: "Overdue",
        countFrom: (summary) => summary.overdue,
    },
];

export function TaskFilterToolbar({
    lens,
    initialSegment,
    initialStatuses,
    initialOwnerIds,
    initialCheckIds,
    initialResourceIds,
    ownerOptions,
    checkOptions,
    resourceOptions,
    currentParams,
    summary,
}: TaskFilterToolbarProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [statuses, setStatuses] = useState(initialStatuses);
    const [ownerIds, setOwnerIds] = useState(initialOwnerIds);
    const [checkIds, setCheckIds] = useState(initialCheckIds);
    const [resourceIds, setResourceIds] = useState(initialResourceIds);
    const [statusOpen, setStatusOpen] = useState(false);
    const [ownerOpen, setOwnerOpen] = useState(false);
    const [checkOpen, setCheckOpen] = useState(false);
    const [resourceOpen, setResourceOpen] = useState(false);

    const hasFilters = useMemo(
        () =>
            initialSegment !== "all" ||
            statuses.length > 0 ||
            ownerIds.length > 0 ||
            checkIds.length > 0 ||
            resourceIds.length > 0,
        [
            resourceIds.length,
            checkIds.length,
            initialSegment,
            ownerIds.length,
            statuses.length,
        ],
    );

    const apply = () => {
        router.replace(
            withLens("/tasks", lens, {
                status: statuses.length > 0 ? statuses : null,
                owner: ownerIds.length > 0 ? ownerIds : null,
                check: checkIds.length > 0 ? checkIds : null,
                resource: resourceIds.length > 0 ? resourceIds : null,
                segment: initialSegment === "all" ? null : initialSegment,
                page: null,
            }),
        );
        setOpen(false);
    };

    const clear = () => {
        setStatuses([]);
        setOwnerIds([]);
        setCheckIds([]);
        setResourceIds([]);
        router.replace(
            withLens("/tasks", lens, {
                segment: initialSegment === "all" ? null : initialSegment,
            }),
        );
        setOpen(false);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-lg">
                    Filters
                    <ListFilter className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Task filters</SheetTitle>
                    <SheetDescription>
                        Narrow the task queue by view, status, owner, check,
                        and resource.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
                    <div className="flex flex-col gap-y-1.5">
                        <p className="text-sm font-medium">Views</p>
                        <div className="grid grid-cols-2 gap-3">
                            {SEGMENTS.map((segment) => {
                                const active = segment.key === initialSegment;
                                const href = withLens(
                                    "/tasks",
                                    lens,
                                    {
                                        ...currentParams,
                                        segment:
                                            segment.key === "all"
                                                ? null
                                                : segment.key,
                                        page: null,
                                    },
                                );

                                return (
                                    <Link
                                        key={segment.key}
                                        href={href}
                                        onClick={() => setOpen(false)}
                                        className="block"
                                    >
                                        <SegmentPill active={active}>
                                            <span className="text-md font-semibold">
                                                {segment.label}
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-sm",
                                                    active
                                                        ? "text-primary-foreground/70"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                {segment.countFrom(summary)}{" "}
                                                tasks
                                            </span>
                                        </SegmentPill>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-y-1.5">
                            <label className="text-sm font-medium">
                                Status
                            </label>
                            <MultiSelectCombobox
                                open={statusOpen}
                                onOpenChange={setStatusOpen}
                                triggerLabel={formatCountLabel(
                                    statuses.length,
                                    "All statuses",
                                    "status",
                                    "statuses",
                                )}
                                triggerIcon={Circle}
                            >
                                <Command className="max-h-[min(20rem,60vh)]">
                                    <CommandList className="max-h-[min(15rem,48vh)] overscroll-contain">
                                        <CommandGroup>
                                            <CommandItem
                                                value="all-statuses"
                                                onSelect={() => setStatuses([])}
                                                className={getFilterOptionItemClass(
                                                    statuses.length === 0,
                                                )}
                                            >
                                                <span className="text-sm font-medium">
                                                    All statuses
                                                </span>
                                            </CommandItem>
                                            {STATUS_OPTIONS.map((option) => {
                                                const Icon = option.icon;
                                                const active =
                                                    statuses.includes(
                                                        option.value,
                                                    );

                                                return (
                                                    <CommandItem
                                                        key={option.value}
                                                        value={option.label}
                                                        onSelect={() =>
                                                            setStatuses(
                                                                toggleSelection(
                                                                    statuses,
                                                                    option.value,
                                                                ),
                                                            )
                                                        }
                                                        className={getFilterOptionItemClass(
                                                            active,
                                                        )}
                                                    >
                                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">
                                                            {option.label}
                                                        </span>
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </MultiSelectCombobox>
                        </div>

                        <div className="flex flex-col gap-y-1.5">
                            <label className="text-sm font-medium">Owner</label>
                            <MultiSelectCombobox
                                open={ownerOpen}
                                onOpenChange={setOwnerOpen}
                                triggerLabel={formatCountLabel(
                                    ownerIds.length,
                                    "All owners",
                                    "owner",
                                    "owners",
                                )}
                                triggerIcon={UserRound}
                            >
                                <Command className="max-h-[min(20rem,60vh)]">
                                    <CommandInput placeholder="Search owner" />
                                    <CommandList className="max-h-[min(15rem,48vh)] overscroll-contain">
                                        <CommandEmpty>
                                            No owner found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="all-owners"
                                                onSelect={() => setOwnerIds([])}
                                                className={getFilterOptionItemClass(
                                                    ownerIds.length === 0,
                                                )}
                                            >
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-medium">
                                                        All owners
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Show work assigned
                                                        across the team.
                                                    </p>
                                                </div>
                                            </CommandItem>
                                            {ownerOptions.map((owner) => {
                                                const active =
                                                    ownerIds.includes(owner.id);

                                                return (
                                                    <CommandItem
                                                        key={owner.id}
                                                        value={`${owner.name} ${owner.email}`}
                                                        onSelect={() =>
                                                            setOwnerIds(
                                                                toggleSelection(
                                                                    ownerIds,
                                                                    owner.id,
                                                                ),
                                                            )
                                                        }
                                                        className={getFilterOptionItemClass(
                                                            active,
                                                        )}
                                                    >
                                                        <Avatar size="sm">
                                                            <AvatarFallback>
                                                                {initials(
                                                                    owner.name,
                                                                )}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-medium">
                                                                {owner.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {owner.email}
                                                            </p>
                                                        </div>
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </MultiSelectCombobox>
                        </div>

                        <div className="flex flex-col gap-y-1.5">
                            <label className="text-sm font-medium">
                                Check
                            </label>
                            <MultiSelectCombobox
                                open={checkOpen}
                                onOpenChange={setCheckOpen}
                                triggerLabel={formatCountLabel(
                                    checkIds.length,
                                    "All checks",
                                    "check",
                                    "checks",
                                )}
                                triggerIcon={Waypoints}
                            >
                                <Command className="max-h-[min(20rem,60vh)]">
                                    <CommandInput placeholder="Search check" />
                                    <CommandList className="max-h-[min(15rem,48vh)] overscroll-contain">
                                        <CommandEmpty>
                                            No check found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="all-checks"
                                                onSelect={() =>
                                                    setCheckIds([])
                                                }
                                                className={getFilterOptionItemClass(
                                                    checkIds.length === 0,
                                                )}
                                            >
                                                All checks
                                            </CommandItem>
                                            {checkOptions.map((check) => {
                                                const active =
                                                    checkIds.includes(
                                                        check.id,
                                                    );

                                                return (
                                                    <CommandItem
                                                        key={check.id}
                                                        value={check.label}
                                                        onSelect={() =>
                                                            setCheckIds(
                                                                toggleSelection(
                                                                    checkIds,
                                                                    check.id,
                                                                ),
                                                            )
                                                        }
                                                        className={getFilterOptionItemClass(
                                                            active,
                                                        )}
                                                    >
                                                        {check.label}
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </MultiSelectCombobox>
                        </div>

                        <div className="flex flex-col gap-y-1.5">
                            <label className="text-sm font-medium">Resource</label>
                            <MultiSelectCombobox
                                open={resourceOpen}
                                onOpenChange={setResourceOpen}
                                triggerLabel={formatCountLabel(
                                    resourceIds.length,
                                    "All resources",
                                    "resource",
                                    "resources",
                                )}
                                triggerIcon={Boxes}
                            >
                                <Command className="max-h-[min(20rem,60vh)]">
                                    <CommandInput placeholder="Search resource" />
                                    <CommandList className="max-h-[min(15rem,48vh)] overscroll-contain">
                                        <CommandEmpty>
                                            No resource found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="all-resources"
                                                onSelect={() => setResourceIds([])}
                                                className={getFilterOptionItemClass(
                                                    resourceIds.length === 0,
                                                )}
                                            >
                                                All resources
                                            </CommandItem>
                                            {resourceOptions.map((resource) => {
                                                const active =
                                                    resourceIds.includes(resource.id);

                                                return (
                                                    <CommandItem
                                                        key={resource.id}
                                                        value={resource.label}
                                                        onSelect={() =>
                                                            setResourceIds(
                                                                toggleSelection(
                                                                    resourceIds,
                                                                    resource.id,
                                                                ),
                                                            )
                                                        }
                                                        className={getFilterOptionItemClass(
                                                            active,
                                                        )}
                                                    >
                                                        {resource.label}
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </MultiSelectCombobox>
                        </div>
                    </div>
                </div>

                <Separator className="opacity-50" />
                <SheetFooter className="flex-row justify-end">
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
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

function SegmentPill({
    active,
    children,
}: {
    active?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "relative flex flex-col justify-between rounded-xl border px-3 py-1.5 text-left transition-colors",
                active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted/60",
            )}
        >
            <div className="flex flex-col">{children}</div>
            <span
                className={cn(
                    "absolute right-3 top-3 h-4 w-4 rounded-full border",
                    active
                        ? "border-primary-foreground/50 bg-primary-foreground/40"
                        : "border-foreground/20",
                )}
            />
        </div>
    );
}

function MultiSelectCombobox({
    open,
    onOpenChange,
    triggerLabel,
    triggerIcon: Icon,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    triggerLabel: string;
    triggerIcon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="h-11 w-full justify-between rounded-lg bg-background px-3 text-sm font-normal shadow-xs"
                >
                    <span className="flex min-w-0 items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{triggerLabel}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-[var(--radix-popover-trigger-width)] p-0"
            >
                {children}
            </PopoverContent>
        </Popover>
    );
}

function getFilterOptionItemClass(active: boolean) {
    return cn(
        "items-start rounded-md px-3 py-2 transition-colors",
        active && "bg-accent/50 text-accent-foreground/80",
    );
}

function formatCountLabel(
    count: number,
    emptyLabel: string,
    singular: string,
    plural: string,
): string {
    if (count === 0) {
        return emptyLabel;
    }

    return `${count} ${count === 1 ? singular : plural}`;
}

function toggleSelection<T extends string>(values: T[], value: T): T[] {
    if (values.includes(value)) {
        return values.filter((item) => item !== value);
    }

    return [...values, value];
}

function initials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase();
}
