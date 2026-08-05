import { z } from "zod";

const RESOURCE_CATEGORIES = ["device", "service", "resource", "entity"] as const;
const RESOURCE_CRITICALITIES = ["low", "medium", "high", "critical"] as const;
const RESOURCE_SENSITIVITIES = ["public", "internal", "restricted"] as const;

export const createResourceInputSchema = z.object({
    name: z.string().trim().min(1).max(256),
    category: z.enum(RESOURCE_CATEGORIES),
    ownerName: z.string().trim().min(1).max(256),
    ownerId: z.string().trim().min(1).max(128).optional(),
    criticality: z.enum(RESOURCE_CRITICALITIES),
    sensitivity: z.enum(RESOURCE_SENSITIVITIES),
    description: z.string().trim().max(2000).optional(),
});

export type CreateResourceInputParsed = z.infer<typeof createResourceInputSchema>;
