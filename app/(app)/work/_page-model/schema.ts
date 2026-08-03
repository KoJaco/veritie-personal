import { z } from "zod";

const dashboardEntityRefSchema = z
    .object({
        kind: z.string().min(1),
        id: z.string().min(1),
        summary: z.string().optional(),
        title: z.string().optional(),
        href: z.string().optional(),
    })
    .strict();

const dashboardSectionSchema = z
    .object({
        key: z.string().min(1),
        title: z.string().optional(),
        kind: z.string().min(1),
        dataRef: dashboardEntityRefSchema.optional(),
        items: z.array(dashboardEntityRefSchema).optional(),
    })
    .strict();

export const dashboardPageModelSchema = z
    .object({
        meta: z
            .object({
                title: z.string().min(1),
                description: z.string().optional(),
                breadcrumbs: z
                    .array(
                        z
                            .object({
                                label: z.string().min(1),
                                href: z.string().optional(),
                            })
                            .strict(),
                    )
                    .optional(),
                scope: z.record(z.string(), z.unknown()).optional(),
            })
            .strict(),
        view: z
            .object({
                key: z.string().min(1),
                featureFlags: z.record(z.string(), z.unknown()).optional(),
            })
            .strict(),
        refs: z
            .object({
                primary: dashboardEntityRefSchema.optional(),
                visible: z.array(dashboardEntityRefSchema).optional(),
            })
            .strict()
            .optional(),
        sections: z.array(dashboardSectionSchema),
        capabilities: z.record(z.string(), z.unknown()),
        actions: z
            .object({
                available: z.array(z.string()),
            })
            .strict(),
    })
    .strict();

export const dashboardRailPayloadSchema = z
    .object({
        scope: z.object({ type: z.string(), id: z.string().optional() }).strict(),
        primaryObject: z
            .object({
                type: z.string(),
                id: z.string(),
            })
            .strict()
            .optional(),
        data: z.record(z.string(), z.unknown()).optional(),
    })
    .strict();

export const workRouteContractSchema = z
    .object({
        pageModel: dashboardPageModelSchema,
        railPayloadCandidate: dashboardRailPayloadSchema.nullable(),
    })
    .strict();

export type DashboardPageModelContract = z.infer<typeof dashboardPageModelSchema>;
export type DashboardRouteContract = z.infer<typeof workRouteContractSchema>;
