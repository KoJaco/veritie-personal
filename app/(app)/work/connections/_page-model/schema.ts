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

const connectionsPageModelSchema = z
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
                key: z.enum(["connections_index", "connections_detail"]),
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

const connectionsRailPayloadSchema = z
    .object({
        scope: z.union([
            z.object({ type: z.literal("connections_index") }).strict(),
            z
                .object({
                    type: z.literal("connections_detail"),
                    id: z.string().min(1),
                })
                .strict(),
        ]),
        data: z.record(z.string(), z.unknown()).optional(),
    })
    .strict();

export const connectionsRouteContractSchema = z
    .object({
        pageModel: connectionsPageModelSchema,
        railPayloadCandidate: connectionsRailPayloadSchema.nullable(),
    })
    .strict();

export type ConnectionsPageModelContract = z.infer<
    typeof connectionsPageModelSchema
>;
