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

const pageModelSchema = z
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
                aspect: z.object({ aspectId: z.string().min(1) }).strict(),
            })
            .strict(),
        view: z
            .object({
                key: z.enum(["tasks_index", "task_detail"]),
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

const railPayloadSchema = z
    .object({
        scope: z.union([
            z.object({ type: z.literal("task_index") }).strict(),
            z
                .object({
                    type: z.literal("task_detail"),
                    id: z.string().min(1),
                })
                .strict(),
        ]),
        primaryObject: z
            .object({
                type: z.literal("task"),
                id: z.string().min(1),
            })
            .strict()
            .optional(),
        data: z.record(z.string(), z.unknown()).optional(),
    })
    .strict();

export const tasksRouteContractSchema = z
    .object({
        pageModel: pageModelSchema,
        railPayloadCandidate: railPayloadSchema.nullable(),
    })
    .strict();
