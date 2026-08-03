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

export const capturesPageModelSchema = z
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
                key: z.literal("captures_index"),
                featureFlags: z.record(z.string(), z.unknown()).optional(),
            })
            .strict(),
        refs: z
            .object({
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

export const capturesRouteContractSchema = z
    .object({
        pageModel: capturesPageModelSchema,
        railPayloadCandidate: z.any().nullable(),
    })
    .strict();
