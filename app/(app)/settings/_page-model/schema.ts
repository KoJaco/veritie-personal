import { z } from "zod";

export const settingsRouteContractSchema = z
    .object({
        pageModel: z.record(z.string(), z.unknown()),
        railPayloadCandidate: z.record(z.string(), z.unknown()).nullable(),
    })
    .strict();
