"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { updateExtractedValueAction } from "@/lib/actions/stub-data-mutations";
import { formatArtifactKey } from "@/lib/artifact-display";
import { flattenExtractedValueAttributes } from "@/lib/capture/flatten-extracted-value";
import { ASPECT_DEFINITIONS } from "@/lib/domain/aspect";
import type { ExtractedValueStub } from "@/lib/stubs/capture-stubs";

function inferInputType(key: string, value: unknown): "text" | "number" | "checkbox" {
    if (typeof value === "boolean") {
        return "checkbox";
    }
    if (typeof value === "number") {
        return "number";
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

export function ExtractedValueEditorSheet({
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
    const router = useRouter();
    const initialAttributes = useMemo(
        () => flattenExtractedValueAttributes(extractedValue),
        [extractedValue],
    );
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const nextValues: Record<string, string> = {};
        for (const [key, value] of Object.entries(initialAttributes)) {
            nextValues[key] = serializeFieldValue(value);
        }
        setFormValues(nextValues);
        setError(null);
    }, [open, initialAttributes]);

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
            onOpenChange(false);
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
        onOpenChange,
        onSaved,
        router,
    ]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Edit extracted value</SheetTitle>
                    <SheetDescription>
                        {listKey.replace(/_/g, " ")} #{index + 1}. Changes sync to
                        capture extraction, timeline, and index quotes.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-4 overflow-y-auto py-4">
                    {fieldKeys.map((key) => {
                        const original = initialAttributes[key];
                        const inputType = inferInputType(key, original);

                        if (key === "aspect") {
                            return (
                                <div key={key} className="space-y-2">
                                    <label
                                        htmlFor={`edit-${key}`}
                                        className="text-sm font-medium"
                                    >
                                        {formatArtifactKey(key, glossaryLabels)}
                                    </label>
                                    <select
                                        id={`edit-${key}`}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                        value={formValues[key] ?? ""}
                                        onChange={(event) =>
                                            setFormValues((current) => ({
                                                ...current,
                                                [key]: event.target.value,
                                            }))
                                        }
                                    >
                                        {ASPECT_DEFINITIONS.map((aspect) => (
                                            <option key={aspect.id} value={aspect.id}>
                                                {aspect.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        }

                        if (inputType === "checkbox") {
                            return (
                                <div key={key} className="flex items-center gap-2">
                                    <input
                                        id={`edit-${key}`}
                                        type="checkbox"
                                        className="size-4 rounded border border-input"
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
                                    <label
                                        htmlFor={`edit-${key}`}
                                        className="text-sm font-medium"
                                    >
                                        {formatArtifactKey(key, glossaryLabels)}
                                    </label>
                                </div>
                            );
                        }

                        return (
                            <div key={key} className="space-y-2">
                                <label
                                    htmlFor={`edit-${key}`}
                                    className="text-sm font-medium"
                                >
                                    {formatArtifactKey(key, glossaryLabels)}
                                </label>
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
                            </div>
                        );
                    })}

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>

                <SheetFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={pending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={pending}
                    >
                        {pending ? "Saving…" : "Save changes"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export function ExtractedValueEditorTrigger({
    extractedValue,
    listKey,
    index,
    glossaryLabels,
    onSaved,
    size = "sm",
}: {
    extractedValue: ExtractedValueStub;
    listKey: string;
    index: number;
    glossaryLabels?: Record<string, string>;
    onSaved?: () => void;
    size?: "sm" | "default";
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                type="button"
                size={size}
                variant="outline"
                onClick={() => setOpen(true)}
            >
                Edit
            </Button>
            <ExtractedValueEditorSheet
                open={open}
                onOpenChange={setOpen}
                extractedValue={extractedValue}
                listKey={listKey}
                index={index}
                glossaryLabels={glossaryLabels}
                onSaved={onSaved}
            />
        </>
    );
}
