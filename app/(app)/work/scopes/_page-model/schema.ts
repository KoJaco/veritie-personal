import { z } from "zod";

const scopesRouteIdSchema = z.enum([
    "scopes_index",
    "scopes_operations_readiness",
    "scopes_workspace_resilience",
    "scopes_knowledge_hygiene",
    "scopes_delivery_observability",
]);

const scopesLensSchema = z
    .object({
        scope: z
            .enum([
                "all",
                "operations-readiness",
                "delivery-observability",
                "workspace-resilience",
                "knowledge-hygiene",
            ])
            .optional(),
    })
    .strict();

export const scopesRouteContractSchema = z
    .object({
        scope: scopesRouteIdSchema,
        lens: scopesLensSchema.optional(),
        railPayloadCandidate: z.unknown().nullable(),
    })
    .strict();

export type ScopesRouteContract = z.infer<typeof scopesRouteContractSchema>;
