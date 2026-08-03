"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    ArrowRight,
    ChevronDownIcon,
    CircleCheckBig,
    FileUp,
    RefreshCcw,
    Upload,
    X,
} from "lucide-react";
import { useIsMobileViewport } from "@/lib/hooks/useIsMobileViewport";
import { SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { uploadAttachmentVersionViaApi } from "@/lib/attachments/upload-attachment-version-client";

export type AttachmentAttachContext =
    | { kind: "task"; taskId: string; taskTitle: string }
    | { kind: "object"; objectId: string; objectTitle: string }
    | { kind: "resource"; resourceId: string; resourceTitle: string }
    | { kind: "library" }
    | { kind: "attachment"; attachmentId: string; attachmentTitle: string };

type UploadStep = 1 | 2 | 3;

type AttachmentUploadFlowProps = {
    context: AttachmentAttachContext;
    triggerLabel?: string;
    triggerVariant?: "default" | "outline" | "secondary";
    triggerSize?: "default" | "sm";
    triggerIcon?: React.ReactNode;
    onCompleted?: (result: {
        attachmentId: string;
        versionNumber: number;
    }) => void;
};

const ATTACHMENT_TYPES = [
    "policy",
    "procedure",
    "report",
    "export",
    "screenshot",
    "log",
    "attestation",
    "other",
] as const;

export function AttachmentUploadFlow({
    context,
    triggerLabel = "Upload attachment",
    triggerVariant = "default",
    triggerSize = "sm",
    triggerIcon = <Upload />,
    onCompleted,
}: AttachmentUploadFlowProps) {
    const router = useRouter();
    const isMobile = useIsMobileViewport();

    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<UploadStep>(1);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<(typeof ATTACHMENT_TYPES)[number]>("report");
    const [validFrom, setValidFrom] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        open: openPicker,
    } = useDropzone({
        multiple: false,
        noClick: true,
        onDrop: (acceptedFiles) => {
            const file = acceptedFiles[0] ?? null;
            setSelectedFile(file);
            if (file && !title.trim()) {
                setTitle(file.name.replace(/\.[a-z0-9]+$/i, ""));
            }
        },
    });

    const canGoNext = useMemo(() => {
        if (step === 1) {
            return Boolean(selectedFile);
        }
        if (step === 2) {
            return Boolean(title.trim());
        }
        return true;
    }, [selectedFile, step, title]);

    const canVisitStep = (targetStep: UploadStep) => {
        if (targetStep === 1) return true;
        if (targetStep === 2) return Boolean(selectedFile);
        return Boolean(selectedFile) && Boolean(title.trim());
    };

    const resetFlow = () => {
        setStep(1);
        setSelectedFile(null);
        setTitle("");
        setDescription("");
        setType("report");
        setValidFrom("");
        setValidUntil("");
        setIsSubmitting(false);
    };

    const clearSelectedFile = () => {
        setSelectedFile(null);
        setStep(1);
    };

    const close = () => {
        setOpen(false);
        resetFlow();
    };

    const submit = async () => {
        setIsSubmitting(true);
        try {
            const result =
                context.kind === "attachment"
                    ? await uploadAttachmentVersion({
                          attachmentId: context.attachmentId,
                          title,
                          description,
                          kind: type,
                          file: selectedFile,
                          validFrom,
                          validUntil,
                    })
                    : await Promise.resolve({
                          attachmentId: `attachment_${Date.now()}`,
                          versionNumber: 1,
                      });

            toast.success(
                `Uploaded ${selectedFile?.name ?? "attachment"} as v${result.versionNumber}.`,
                {
                    description:
                        context.kind === "task"
                            ? `Attached to task: ${context.taskTitle}`
                            : context.kind === "object"
                              ? `Attached to object: ${context.objectTitle}`
                            : context.kind === "resource"
                              ? `Attached to resource: ${context.resourceTitle}`
                              : context.kind === "attachment"
                                ? `Current attachment root: ${context.attachmentTitle}`
                                : "Saved to the unattached attachment library.",
                },
            );
            setIsSubmitting(false);
            setOpen(false);

            onCompleted?.(result);
            router.refresh();

            resetFlow();
        } catch (error) {
            console.error("Failed to upload attachment", error);
            toast.error("Attachment upload failed.", {
                description:
                    context.kind === "attachment"
                        ? `Could not append a new version to ${context.attachmentTitle}.`
                        : "Please try again after checking the file and metadata.",
            });
            setIsSubmitting(false);
        }
    };

    const trigger = (
        <Button variant={triggerVariant} size={triggerSize}>
            {triggerLabel}
            {triggerIcon}
        </Button>
    );

    return (
        <>
            {isMobile ? (
                <Drawer open={open} onOpenChange={setOpen}>
                    <DrawerTrigger asChild>{trigger}</DrawerTrigger>
                    <DrawerContent>
                            <DrawerHeader className="text-left">
                                <DrawerTitle>Upload Attachment</DrawerTitle>
                                <DrawerDescription>
                                    Add supporting attachment and link it to the current context.
                                </DrawerDescription>
                            </DrawerHeader>
                        <div className="px-4 pb-4">
                            <AttachmentUploadFlowContent
                                step={step}
                                selectedFile={selectedFile}
                                title={title}
                                description={description}
                                type={type}
                                validFrom={validFrom}
                                validUntil={validUntil}
                                isDragActive={isDragActive}
                                context={context}
                                canVisitStep={canVisitStep}
                                canGoNext={canGoNext}
                                isSubmitting={isSubmitting}
                                getRootProps={getRootProps}
                                getInputProps={getInputProps}
                                openPicker={openPicker}
                                clearSelectedFile={clearSelectedFile}
                                setTitle={setTitle}
                                setDescription={setDescription}
                                setType={setType}
                                setValidFrom={setValidFrom}
                                setValidUntil={setValidUntil}
                                setStep={setStep}
                                close={close}
                                submit={submit}
                            />
                        </div>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>{trigger}</DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Upload Attachment</DialogTitle>
                            <DialogDescription>
                                Add supporting attachment and link it to the current context.
                            </DialogDescription>
                        </DialogHeader>
                        <AttachmentUploadFlowContent
                            step={step}
                            selectedFile={selectedFile}
                            title={title}
                            description={description}
                            type={type}
                            validFrom={validFrom}
                            validUntil={validUntil}
                            isDragActive={isDragActive}
                            context={context}
                            canVisitStep={canVisitStep}
                            canGoNext={canGoNext}
                            isSubmitting={isSubmitting}
                            getRootProps={getRootProps}
                            getInputProps={getInputProps}
                            openPicker={openPicker}
                            clearSelectedFile={clearSelectedFile}
                            setTitle={setTitle}
                            setDescription={setDescription}
                            setType={setType}
                            setValidFrom={setValidFrom}
                            setValidUntil={setValidUntil}
                            setStep={setStep}
                            close={close}
                            submit={submit}
                        />
                    </DialogContent>
                </Dialog>
            )}

        </>
    );
}

type AttachmentUploadFlowContentProps = {
    step: UploadStep;
    selectedFile: File | null;
    title: string;
    description: string;
    type: (typeof ATTACHMENT_TYPES)[number];
    validFrom: string;
    validUntil: string;
    isDragActive: boolean;
    context: AttachmentAttachContext;
    canVisitStep: (step: UploadStep) => boolean;
    canGoNext: boolean;
    isSubmitting: boolean;
    getRootProps: ReturnType<typeof useDropzone>["getRootProps"];
    getInputProps: ReturnType<typeof useDropzone>["getInputProps"];
    openPicker: () => void;
    clearSelectedFile: () => void;
    setTitle: (value: string) => void;
    setDescription: (value: string) => void;
    setType: (value: (typeof ATTACHMENT_TYPES)[number]) => void;
    setValidFrom: (value: string) => void;
    setValidUntil: (value: string) => void;
    setStep: React.Dispatch<React.SetStateAction<UploadStep>>;
    close: () => void;
    submit: () => void;
};

function AttachmentUploadFlowContent({
    step,
    selectedFile,
    title,
    description,
    type,
    validFrom,
    validUntil,
    isDragActive,
    context,
    canVisitStep,
    canGoNext,
    isSubmitting,
    getRootProps,
    getInputProps,
    openPicker,
    clearSelectedFile,
    setTitle,
    setDescription,
    setType,
    setValidFrom,
    setValidUntil,
    setStep,
    close,
    submit,
}: AttachmentUploadFlowContentProps) {
    return (
        <div className="space-y-4">
            {step === 1 ? (
                <section className="space-y-3">
                    {selectedFile ? (
                        <div
                            className={cn(
                                SURFACE_CLASS_NESTED,
                                "flex h-44 items-center justify-center p-4 text-center",
                            )}
                        >
                            <div className="space-y-3">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background">
                                    <CircleCheckBig className="h-5 w-5" />
                                </div>
                                <div className="space-y-1 text-sm">
                                    <p className="font-medium">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {formatBytes(selectedFile.size)} ·{" "}
                                        {selectedFile.type || "unknown type"}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={clearSelectedFile}
                                >
                                    Clear file
                                    <X />
                                </Button>
                            </div>
                        </div>
                    ) : null}

                    {!selectedFile ? (
                        <div
                            {...getRootProps()}
                            className={cn(
                                "flex h-44 items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm transition-colors",
                                isDragActive
                                    ? "border-primary bg-primary/5"
                                    : "border-border",
                            )}
                        >
                            <input {...getInputProps()} />
                            <div className="space-y-3">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background">
                                    <FileUp className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium">
                                        {isDragActive
                                            ? "Drop file to attach"
                                            : "Drag and drop attachment file here"}
                                    </p>
                                    <p className="text-muted-foreground">
                                        Or use the file picker to continue.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={openPicker}
                                >
                                    Select file
                                    <Upload />
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </section>
            ) : null}

            {step === 2 ? (
                <section className="space-y-3">
                    <div className={cn(SURFACE_CLASS_NESTED, "space-y-3 p-4")}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                                placeholder="Attachment title"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                placeholder="Optional notes"
                                className="min-h-[90px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Type
                                </label>
                                <Select
                                    value={type}
                                    onValueChange={(value) =>
                                        setType(
                                            value as (typeof ATTACHMENT_TYPES)[number],
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ATTACHMENT_TYPES.map((option) => (
                                            <SelectItem
                                                key={option}
                                                value={option}
                                            >
                                                {capitalize(option)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Valid from
                                </label>
                                <DatePicker
                                    value={validFrom}
                                    onChange={(date) =>
                                        setValidFrom(date ?? "")
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Valid until
                                </label>
                                <DatePicker
                                    value={validUntil}
                                    onChange={(date) =>
                                        setValidUntil(date ?? "")
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}

            {step === 3 ? (
                <section className="space-y-3 rounded-md border p-3 text-sm">
                    <ReviewRow
                        label="File"
                        value={selectedFile?.name ?? "None selected"}
                    />
                    <ReviewRow label="Title" value={title || "Untitled"} />
                    <ReviewRow label="Type" value={capitalize(type)} />
                    <ReviewRow
                        label="Attach target"
                        value={
                            context.kind === "task"
                                ? `Task: ${context.taskTitle}`
                                : context.kind === "object"
                                  ? `Object: ${context.objectTitle}`
                                  : context.kind === "attachment"
                                    ? `Attachment: ${context.attachmentTitle}`
                                  : "Library (unattached)"
                        }
                    />
                    <ReviewRow
                        label="Derived mapping"
                        value={
                            context.kind === "library"
                                ? "No relation (unattached attachment)"
                                : context.kind === "attachment"
                                  ? "Appends a new immutable version to the existing attachment root"
                                : "Derived checks/scopes from existing mapping"
                        }
                    />
                    {validFrom || validUntil ? (
                        <ReviewRow
                            label="Validity"
                            value={`${validFrom || "-"} -> ${validUntil || "-"}`}
                        />
                    ) : null}
                </section>
            ) : null}

            <div className="flex w-full items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-3 text-sm">
                    {UPLOAD_STEPS.map((uploadStep) => {
                        const active = uploadStep.key === step;
                        const enabled = canVisitStep(uploadStep.key);

                        return (
                            <button
                                key={uploadStep.key}
                                type="button"
                                onClick={() =>
                                    enabled && setStep(uploadStep.key)
                                }
                                disabled={!enabled}
                                className={cn(
                                    "inline-flex items-center gap-2 text-left transition-colors",
                                    active
                                        ? "text-foreground"
                                        : "text-muted-foreground",
                                    !enabled && "cursor-not-allowed opacity-50",
                                )}
                            >
                                <span className="font-medium">
                                    {uploadStep.label}
                                </span>
                                {uploadStep.key !== 3 ? (
                                    <span className="text-border">/</span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <Button variant="outline" onClick={close}>
                        <span className="md:block hidden">Cancel</span>
                        <RefreshCcw />
                    </Button>

                    {step < 3 ? (
                        <Button
                            onClick={() =>
                                setStep(
                                    (current) =>
                                        Math.min(3, current + 1) as UploadStep,
                                )
                            }
                            disabled={!canGoNext}
                        >
                            Next
                            <ArrowRight />
                        </Button>
                    ) : (
                        <Button
                            onClick={submit}
                            disabled={isSubmitting || !selectedFile}
                        >
                            {isSubmitting
                                ? "Uploading..."
                                : context.kind === "attachment"
                                  ? "Upload new version"
                                  : "Upload and attach"}
                            <Upload />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid grid-cols-3 gap-2">
            <p className="text-muted-foreground">{label}</p>
            <p className="col-span-2">{value}</p>
        </div>
    );
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatBytes(value: number): string {
    if (value < 1024) return `${value} B`;
    const kb = value / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
}

async function uploadAttachmentVersion({
    attachmentId,
    title,
    description,
    kind,
    file,
    validFrom,
    validUntil,
}: {
    attachmentId: string;
    title: string;
    description: string;
    kind: (typeof ATTACHMENT_TYPES)[number];
    file: File | null;
    validFrom: string;
    validUntil: string;
}): Promise<{
    attachmentId: string;
    versionNumber: number;
}> {
    if (!file) {
        throw new Error("File is required to upload a new attachment version");
    }

    const result = await uploadAttachmentVersionViaApi({
        attachmentId,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        kind,
        fileName: file.name,
        mimeType: file.type || undefined,
        sizeBytes: file.size,
        validFrom: validFrom || undefined,
        validUntil: validUntil || undefined,
    });

    return {
        attachmentId: result.attachmentId,
        versionNumber: result.versionNumber,
    };
}

const UPLOAD_STEPS: Array<{ key: UploadStep; label: string }> = [
    { key: 1, label: "File" },
    { key: 2, label: "Metadata" },
    { key: 3, label: "Review" },
];

function DatePicker({
    value,
    onChange,
}: {
    value?: string;
    onChange: (next?: string) => void;
}) {
    const selected = parseDate(value);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    data-empty={!selected}
                    className="data-[empty=true]:text-muted-foreground h-9 w-full justify-between text-left text-sm font-normal"
                >
                    {selected ? (
                        format(selected, "PPP")
                    ) : (
                        <span>Pick a date</span>
                    )}
                    <ChevronDownIcon />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={(date) => onChange(toDateString(date))}
                    defaultMonth={selected ?? new Date()}
                />
            </PopoverContent>
        </Popover>
    );
}

function parseDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return date;
}

function toDateString(value?: Date): string | undefined {
    if (!value) return undefined;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
