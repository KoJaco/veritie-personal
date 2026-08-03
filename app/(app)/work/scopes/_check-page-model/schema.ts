import { z } from "zod";

export const checkRouteContractSchema = z
    .object({
        pageModel: z.object({
            meta: z.object({
                title: z.string(),
                description: z.string().optional(),
                breadcrumbs: z.array(
                    z.object({
                        label: z.string(),
                        href: z.string().optional(),
                    }),
                ),
                scope: z.object({
                    scopeId: z.string().min(1),
                }),
            }),
            view: z.object({
                key: z.literal("scope_check_detail"),
                featureFlags: z.record(z.string(), z.boolean()).optional(),
            }),
            refs: z
                .object({
                    primary: z
                        .object({
                            kind: z.string(),
                            id: z.string(),
                            title: z.string().optional(),
                            summary: z.string().optional(),
                            href: z.string().optional(),
                        })
                        .optional(),
                    visible: z
                        .array(
                            z.object({
                                kind: z.string(),
                                id: z.string(),
                                title: z.string().optional(),
                                summary: z.string().optional(),
                                href: z.string().optional(),
                            }),
                        )
                        .optional(),
                })
                .optional(),
            sections: z.array(
                z.object({
                    key: z.string(),
                    title: z.string().optional(),
                    kind: z.string(),
                    dataRef: z
                        .object({
                            kind: z.string(),
                            id: z.string(),
                        })
                        .optional(),
                    items: z
                        .array(
                            z.object({
                                kind: z.string(),
                                id: z.string(),
                                summary: z.string().optional(),
                            }),
                        )
                        .optional(),
                }),
            ),
            capabilities: z.record(z.string(), z.boolean()),
            actions: z.object({
                available: z.array(z.string()),
            }),
        }),
        checkScope: z
            .object({
                scopeId: z.enum([
                    "operations-readiness",
                    "delivery-observability",
                    "workspace-resilience",
                    "knowledge-hygiene",
                ]),
            })
            .strict(),
        railPayloadCandidate: z.unknown().nullable(),
    })
    .strict();

export type CheckRouteContract = z.infer<typeof checkRouteContractSchema>;
