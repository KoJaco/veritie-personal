"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Drawer,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import {
    Dialog,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    NestedDialogContent,
    NestedDrawerContent,
} from "@/components/ui/nested-dialog";
import { updateExtractedValueAction } from "@/lib/actions/stub-data-mutations";
import { formatArtifactKey } from "@/lib/artifact-display";
import { flattenExtractedValueAttributes } from "@/lib/capture/flatten-extracted-value";
import { ASPECT_DEFINITIONS } from "@/lib/domain/aspect";
import { formatLocaleDateTime, isDateLike } from "@/lib/format/iso-datetime";
import { useIsMobileViewport } from "@/lib/hooks/useIsMobileViewport";
import type { ExtractedValueStub } from "@/lib/stubs/capture-stubs";
import { cn } from "@/lib/utils";
import { SURFACE_CLASS } from "@/lib/ui/surface";

function inferInputType(key: string, value: unknown): "text" | "number" | "checkbox" {
    if (typeof value === "boolean") {
        return "checkbox";
    }
    if (typeof value === "number") {
        return "number";
    }
    if (typeof value === "string" && isDateLike(value)) {
        return "text";
    }
    if (key.endsWith("_at")) {
        return "text";
    }
    return "text";
}

function serializeFieldValue(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }
    if (typeof value === "boolean") {
        return value ? "true" : "false";
    }
    return String(value);
}

function parseFieldValue(
    key: string,
    raw: string,
    original: unknown,
): unknown {
    if (key === "aspect") {
        return raw;
    }

    if (typeof original === "boolean") {
        return raw === "true";
    }

    if (typeof original === "number" && raw.trim() !== "") {
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : original;
    }

    if (raw.trim() === "") {
        return null;
    }

    return raw;
}

export function ExtractedValueEditorForm({
    extractedValue,
    listKey,
    index,
    glossaryLabels,
    onSaved,
    onClose,
}: {
    extractedValue: ExtractedValueStub;
    listKey: string;
    index: number;
    glossaryLabels?: Record<string, string>;
    onSaved?: () => void;
    onClose: () => void;
}) {
    const router = useRouter();
    const initialAttributes = useMemo(
        () => flattenExtractedValueAttributes(extractedValue),
        [extractedValue],
    );
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const nextValues: Record<string, string> = {};
        for (const [key, value] of Object.entries(initialAttributes)) {
            nextValues[key] = serializeFieldValue(value);
        }
        setFormValues(nextValues);
        setError(null);
    }, [initialAttributes]);

    const fieldKeys = useMemo(() => Object.keys(initialAttributes), [initialAttributes]);

    const handleSave = useCallback(async () => {
        setPending(true);
        setError(null);

        const attributes: Record<string, unknown> = {};
        for (const key of fieldKeys) {
            attributes[key] = parseFieldValue(
                key,
                formValues[key] ?? "",
                initialAttributes[key],
            );
        }

        try {
            const result = await updateExtractedValueAction(
                extractedValue.id,
                attributes,
            );
            if (!result.ok) {
                throw new Error(result.error);
            }
            onClose();
            onSaved?.();
            router.refresh();
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : "Failed to save changes",
            );
        } finally {
            setPending(false);
        }
    }, [
        extractedValue.id,
        fieldKeys,
        formValues,
        initialAttributes,
        onClose,
        onSaved,
        router,
    ]);

    return (
        <>
            <div className={cn(SURFACE_CLASS, "flex-1 space-y-3 p-3 max-h-[min(85dvh,720px)] mt-3")}>
                {fieldKeys.map((key) => {
                    const original = initialAttributes[key];
                    const inputType = inferInputType(key, original);

                    if (key === "aspect") {
                        return (
                            <div key={key} className="space-y-2">
                                <Label htmlFor={`edit-${key}`}>
                                    {formatArtifactKey(key, glossaryLabels)}
                                </Label>
                                <Select
                                    value={formValues[key] ?? ""}
                                    onValueChange={(value) =>
                                        setFormValues((current) => ({
                                            ...current,
                                            [key]: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger
                                        id={`edit-${key}`}
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ASPECT_DEFINITIONS.map((aspect) => (
                                            <SelectItem
                                                key={aspect.id}
                                                value={aspect.id}
                                            >
                                                {aspect.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        );
                    }

                    if (inputType === "checkbox") {
                        return (
                            <div key={key} className="flex items-center gap-2">
                                <Input
                                    id={`edit-${key}`}
                                    type="checkbox"
                                    className="size-4 w-auto shrink-0"
                                    checked={formValues[key] === "true"}
                                    onChange={(event) =>
                                        setFormValues((current) => ({
                                            ...current,
                                            [key]: event.target.checked
                                                ? "true"
                                                : "false",
                                        }))
                                    }
                                />
                                <Label htmlFor={`edit-${key}`}>
                                    {formatArtifactKey(key, glossaryLabels)}
                                </Label>
                            </div>
                        );
                    }

                    return (
                        <div key={key} className="space-y-2">
                            <Label htmlFor={`edit-${key}`}>
                                {formatArtifactKey(key, glossaryLabels)}
                            </Label>
                            <Input
                                id={`edit-${key}`}
                                type={inputType}
                                value={formValues[key] ?? ""}
                                onChange={(event) =>
                                    setFormValues((current) => ({
                                        ...current,
                                        [key]: event.target.value,
                                    }))
                                }
                            />
                            {isDateLike(formValues[key]) && (
                                <p className="text-xs text-muted-foreground">
                                    {formatLocaleDateTime(formValues[key] ?? "")}
                                </p>
                            )}
                        </div>
                    );
                })}

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}
            </div>

            <div className="flex justify-end gap-2 mt-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={pending}
                >
                    <X className="size-4" />
                    Cancel
                </Button>
                <Button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={pending}
                >
                    {pending ? "Saving…" : "Save changes"}
                </Button>
            </div>
        </>
    );
}

export function ExtractedValueEditorFlow({
    open,
    onOpenChange,
    extractedValue,
    listKey,
    index,
    glossaryLabels,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    extractedValue: ExtractedValueStub;
    listKey: string;
    index: number;
    glossaryLabels?: Record<string, string>;
    onSaved?: () => void;
}) {
    const isMobile = useIsMobileViewport();
    const close = () => onOpenChange(false);

    const header = (
        <>
            <DialogTitle>Edit extracted value</DialogTitle>
            <DialogDescription>
                {listKey.replace(/_/g, " ")} #{index + 1}. Changes sync to capture
                extraction, timeline, and index quotes.
            </DialogDescription>
        </>
    );

    const form = (
        <ExtractedValueEditorForm
            extractedValue={extractedValue}
            listKey={listKey}
            index={index}
            glossaryLabels={glossaryLabels}
            onSaved={onSaved}
            onClose={close}
        />
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <NestedDrawerContent>
                    <DrawerHeader className="text-left">
                        <DrawerTitle>Edit extracted value</DrawerTitle>
                        <DrawerDescription>
                            {listKey.replace(/_/g, " ")} #{index + 1}. Changes sync
                            to capture extraction, timeline, and index quotes.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="flex min-h-0 flex-1 flex-col px-4">{form}</div>
                </NestedDrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <NestedDialogContent className="flex max-h-[min(85dvh,720px)] flex-col gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="shrink-0">{header}</DialogHeader>
                <div className="flex min-h-0 flex-1 flex-col px-1">{form}</div>
                <DialogFooter className="hidden" />
            </NestedDialogContent>
        </Dialog>
    );
}

/** @deprecated Use ExtractedValueEditorFlow */
export const ExtractedValueEditorSheet = ExtractedValueEditorFlow;

export function ExtractedValueEditorTrigger({
    extractedValue,
    listKey,
    index,
    glossaryLabels,
    onSaved,
    variant = "icon",
    className,
}: {
    extractedValue: ExtractedValueStub;
    listKey: string;
    index: number;
    glossaryLabels?: Record<string, string>;
    onSaved?: () => void;
    variant?: "icon" | "labeled";
    className?: string;
}) {
    const isMobile = useIsMobileViewport();
    const [open, setOpen] = useState(false);

    const trigger =
        variant === "labeled" ? (
            <Button
                type="button"
                size="sm"
                variant="outline"
                className={cn("gap-1.5", className)}
            >
                <Pencil className="size-3.5" />
                Edit
            </Button>
        ) : (
            <Button
                type="button"
                size="icon"
                variant="outline"
                className={cn("size-6 rounded-full", className)}
                aria-label="Edit extracted value"
            >
                <Pencil className="size-3" />
            </Button>
        );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>{trigger}</DrawerTrigger>
                <NestedDrawerContent>
                    <DrawerHeader className="text-left">
                        <DrawerTitle>Edit extracted value</DrawerTitle>
                        <DrawerDescription>
                            {listKey.replace(/_/g, " ")} #{index + 1}. Changes sync
                            to capture extraction, timeline, and index quotes.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="flex min-h-0 flex-1 flex-col px-4">
                        <ExtractedValueEditorForm
                            extractedValue={extractedValue}
                            listKey={listKey}
                            index={index}
                            glossaryLabels={glossaryLabels}
                            onSaved={onSaved}
                            onClose={() => setOpen(false)}
                        />
                    </div>
                </NestedDrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <NestedDialogContent className="flex flex-col gap-0 overflow-hidden sm:max-w-2xl">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Edit extracted values</DialogTitle>
                    <DialogDescription>
                        {listKey.replace(/_/g, " ")} #{index + 1}. Changes sync to
                        capture extraction, timeline, and index quotes.
                    </DialogDescription>
                </DialogHeader>
                <div className={cn("flex min-h-0 flex-1 flex-col")}>
                    <ExtractedValueEditorForm
                        extractedValue={extractedValue}
                        listKey={listKey}
                        index={index}
                        glossaryLabels={glossaryLabels}
                        onSaved={onSaved}
                        onClose={() => setOpen(false)}
                    />
                </div>
            </NestedDialogContent>
        </Dialog>
    );
}
