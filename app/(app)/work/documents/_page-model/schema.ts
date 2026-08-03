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

const documentsPageModelSchema = z
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
                key: z.enum(["documents_index", "documents_detail"]),
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
        sections: z.array(
            z
                .object({
                    key: z.string().min(1),
                    title: z.string().optional(),
                    kind: z.string().min(1),
                    dataRef: entityRefSchema.optional(),
                    items: z.array(entityRefSchema).optional(),
                })
                .strict(),
        ),
        capabilities: z.record(z.string(), z.unknown()),
        actions: z
            .object({
                available: z.array(z.string()),
            })
            .strict(),
    })
    .strict();

const documentsRailPayloadSchema = z
    .object({
        scope: z.union([
            z.object({ type: z.literal("documents_index") }).strict(),
            z
                .object({
                    type: z.literal("documents_detail"),
                    id: z.string().min(1),
                })
                .strict(),
        ]),
        primaryObject: z
            .object({
                type: z.literal("artifact"),
                id: z.string().min(1),
            })
            .strict()
            .optional(),
        data: z.record(z.string(), z.unknown()).optional(),
    })
    .strict();

export const documentsRouteContractSchema = z
    .object({
        pageModel: documentsPageModelSchema,
        railPayloadCandidate: documentsRailPayloadSchema.nullable(),
    })
    .strict();
