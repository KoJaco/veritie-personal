import { z } from "zod";

const entityRefSchema = z
    .object({
        kind: z.string().min(1),
        id: z.string().min(1),
        summary: z.string().optional(),
        title: z.string().optional(),
        href: z.string().optional(),
    })
    .strict();

const sectionSchema = z
    .object({
        key: z.string().min(1),
        title: z.string().optional(),
        kind: z.string().min(1),
        dataRef: entityRefSchema.optional(),
        items: z.array(entityRefSchema).optional(),
    })
    .strict();

const resourcesPageModelSchema = z
    .object({
        meta: z
            .object({
                title: z.string().min(1),
                description: z.string().optional(),
                breadcrumbs: z.array(
                    z
                        .object({
                            label: z.string().min(1),
                            href: z.string().optional(),
                        })
                        .strict(),
                ),
                scope: z.object({ scopeId: z.string().min(1) }).strict(),
            })
            .strict(),
        view: z
            .object({
                key: z.enum(["resources_index", "resources_detail"]),
                featureFlags: z.record(z.string(), z.unknown()).optional(),
            })
            .strict(),
        refs: z
            .object({
                primary: entityRefSchema.optional(),
                visible: z.array(entityRefSchema).optional(),
            })
            .strict()
            .optional(),
        sections: z.array(sectionSchema),
        capabilities: z.record(z.string(), z.unknown()),
        actions: z
            .object({
                available: z.array(z.string()),
            })
            .strict(),
    })
    .strict();

const resourcesRailPayloadSchema = z
    .object({
        scope: z.union([
            z.object({ type: z.literal("resources_index") }).strict(),
            z
                .object({
                    type: z.literal("resources_detail"),
                    id: z.string().min(1),
                })
                .strict(),
        ]),
        primaryObject: z
            .object({
                type: z.literal("resource"),
                id: z.string().min(1),
            })
            .strict()
            .optional(),
        data: z.record(z.string(), z.unknown()).optional(),
    })
    .strict();

export const resourcesRouteContractSchema = z
    .object({
        pageModel: resourcesPageModelSchema,
        railPayloadCandidate: resourcesRailPayloadSchema.nullable(),
    })
    .strict();

export type ResourcesPageModelContract = z.infer<typeof resourcesPageModelSchema>;
