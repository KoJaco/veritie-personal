"use client";

import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobileViewport } from "@/lib/hooks/useIsMobileViewport";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus, X } from "lucide-react";

type CreateTaskDialogOption = {
    id: string;
    label: string;
};

type CreateTaskDialogProps = {
    checks: CreateTaskDialogOption[];
    owners: CreateTaskDialogOption[];
    resources: CreateTaskDialogOption[];
};

function parseDate(value?: string): Date | undefined {
    if (!value) {
        return undefined;
    }

    const [yearStr, monthStr, dayStr] = value.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!year || !month || !day) {
        return undefined;
    }

    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

function toDateString(value?: Date): string {
    return value ? format(value, "yyyy-MM-dd") : "";
}

export function CreateTaskDialog({
    checks,
    owners,
    resources,
}: CreateTaskDialogProps) {
    const isMobile = useIsMobileViewport();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [checkId, setCheckId] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [ownerId, setOwnerId] = useState("");
    const [resourceId, setResourceId] = useState("");

    const reset = () => {
        setTitle("");
        setDescription("");
        setCheckId("");
        setDueDate("");
        setOwnerId("");
        setResourceId("");
    };

    const close = () => {
        setOpen(false);
        reset();
    };

    const submit = () => {
        if (!title.trim()) {
            toast.error("Task title is required.");
            return;
        }

        if (!checkId) {
            toast.error("Check is required.");
            return;
        }

        if (!ownerId) {
            toast.error("Owner is required.");
            return;
        }

        toast.success("Task drafted for frontend preview.", {
            description:
                "This branch keeps task creation stubbed and non-persistent.",
        });
        close();
    };

    const selectedDueDate = parseDate(dueDate);

    const content = (
        <div className={cn("space-y-4 p-4", SURFACE_CLASS)}>
            <div className="flex flex-col gap-y-1.5">
                <Label htmlFor="task-title">Title</Label>
                <Input
                    id="task-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Validate privileged access review package"
                />
            </div>

            <div className="flex flex-col gap-y-1.5">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                    id="task-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe the work and supporting attachments expected."
                    className="min-h-24 bg-background"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-y-1.5">
                    <Label>Check</Label>
                    <Select value={checkId} onValueChange={setCheckId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select check" />
                        </SelectTrigger>
                        <SelectContent>
                            {checks.map((check) => (
                                <SelectItem key={check.id} value={check.id}>
                                    {check.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-y-1.5">
                    <Label>Owner</Label>
                    <Select value={ownerId} onValueChange={setOwnerId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                        <SelectContent>
                            {owners.map((owner) => (
                                <SelectItem key={owner.id} value={owner.id}>
                                    {owner.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-y-1.5">
                    <Label>Due date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                data-empty={!selectedDueDate}
                                className="data-[empty=true]:text-muted-foreground h-10 w-full justify-between rounded-lg bg-transparent text-left text-sm font-normal"
                            >
                                {selectedDueDate ? (
                                    format(selectedDueDate, "PPP")
                                ) : (
                                    <span>Pick a due date</span>
                                )}
                                <ChevronDown className="h-4 w-4 opacity-60" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDueDate}
                                onSelect={(date) => setDueDate(toDateString(date))}
                                defaultMonth={selectedDueDate ?? new Date()}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex flex-col gap-y-1.5">
                    <Label>Resource</Label>
                    <Select value={resourceId} onValueChange={setResourceId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Optional resource" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No resource</SelectItem>
                            {resources.map((resource) => (
                                <SelectItem key={resource.id} value={resource.id}>
                                    {resource.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );

    const footer = (
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>
                <X className="h-4 w-4" />
                Cancel
            </Button>
            <Button type="button" onClick={submit}>
                <Plus className="h-4 w-4" />
                Create task
            </Button>
        </div>
    );

    const trigger = (
        <Button size="sm" variant="outline">
            {isMobile ? "" : "Create task"}
            <Plus className="h-4 w-4" />
        </Button>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>{trigger}</DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader className="text-left">
                        <DrawerTitle>Create task</DrawerTitle>
                        <DrawerDescription>
                            Add a new check-linked work item for the current
                            operational queue.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-4">
                        {content}
                        <Separator className="my-4" />
                        {footer}
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create task</DialogTitle>
                    <DialogDescription>
                        Add a new check-linked work item for the current
                        operational queue.
                    </DialogDescription>
                </DialogHeader>
                {content}
                {footer}
            </DialogContent>
        </Dialog>
    );
}
