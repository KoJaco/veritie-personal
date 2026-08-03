"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useIsMobileViewport } from "@/lib/hooks/useIsMobileViewport";
import { createResourceViaApi } from "@/lib/resources/create-resource-client";
import {
    resourceCategoryLabel,
    resourceCriticalityLabel,
} from "@/lib/resources/labels";
import type {
    ResourceCategory,
    ResourceCriticality,
    ResourceSensitivity,
} from "@/lib/stubs";
import { cn } from "@/lib/utils";
import { ArrowRight, Plus, X } from "lucide-react";
import { SURFACE_CLASS } from "@/lib/ui/surface";

const CATEGORIES: ResourceCategory[] = ["device", "service", "resource", "entity"];
const CRITICALITIES: ResourceCriticality[] = ["low", "medium", "high", "critical"];
const SENSITIVITIES: ResourceSensitivity[] = ["public", "internal", "restricted"];

export function ResourceCreateFlow() {
    const router = useRouter();
    const isMobile = useIsMobileViewport();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [category, setCategory] = useState<ResourceCategory>("device");
    const [ownerName, setOwnerName] = useState("");
    const [criticality, setCriticality] = useState<ResourceCriticality>("medium");
    const [sensitivity, setSensitivity] =
        useState<ResourceSensitivity>("internal");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reset = () => {
        setName("");
        setCategory("device");
        setOwnerName("");
        setCriticality("medium");
        setSensitivity("internal");
        setDescription("");
        setIsSubmitting(false);
    };

    const close = () => {
        setOpen(false);
        reset();
    };

    const submit = async () => {
        if (!name.trim()) {
            toast.error("Resource name is required.");
            return;
        }

        if (!ownerName.trim()) {
            toast.error("Resource owner is required.");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createResourceViaApi({
                name: name.trim(),
                category,
                ownerName: ownerName.trim(),
                criticality,
                sensitivity,
                description: description.trim() || undefined,
            });

            toast.success("Resource created.", {
                description: `${name.trim()} is now tracked as a real-world posture resource.`,
            });

            close();
            router.push(`/work/resources/${result.resourceId}`);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Could not create resource.");
            setIsSubmitting(false);
        }
    };

    const content = (
        <div className={cn("space-y-6", SURFACE_CLASS, "p-3")}>
            <div className="space-y-3">
                <label className="text-sm font-medium" htmlFor="resource-name">
                    Name
                </label>
                <Input
                    id="resource-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Identity Platform"
                    className="w-full"
                />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                        value={category}
                        onValueChange={(value) =>
                            setCategory(value as ResourceCategory)
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map((item) => (
                                <SelectItem key={item} value={item}>
                                    {resourceCategoryLabel(item)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="resource-owner"
                    >
                        Owner
                    </label>
                    <Input
                        id="resource-owner"
                        value={ownerName}
                        onChange={(event) => setOwnerName(event.target.value)}
                        placeholder="e.g. Jordan Smith"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Criticality</label>
                    <Select
                        value={criticality}
                        onValueChange={(value) =>
                            setCriticality(value as ResourceCriticality)
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CRITICALITIES.map((item) => (
                                <SelectItem key={item} value={item}>
                                    {resourceCriticalityLabel(item)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Sensitivity</label>
                    <Select
                        value={sensitivity}
                        onValueChange={(value) =>
                            setSensitivity(value as ResourceSensitivity)
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SENSITIVITIES.map((item) => (
                                <SelectItem key={item} value={item}>
                                    {item[0]!.toUpperCase() + item.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );

    const trigger = (
        <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" />
            Add resource
        </Button>
    );

    const footer = (
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>
                <X className="h-4 w-4" />
                Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={isSubmitting}>
                <ArrowRight className="h-4 w-4" />
                {isSubmitting ? "Creating..." : "Create resource"}
            </Button>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>{trigger}</DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader className="text-left">
                        <DrawerTitle>Add resource</DrawerTitle>
                        <DrawerDescription>
                            Create a posture resource for a real-world device,
                            service, resource, or entity.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-4">{content}</div>
                    <DrawerFooter>{footer}</DrawerFooter>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add resource</DialogTitle>
                    <DialogDescription>
                        Create a posture resource for a real-world device, service,
                        resource, or entity.
                    </DialogDescription>
                </DialogHeader>
                {content}
                <DialogFooter>{footer}</DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
