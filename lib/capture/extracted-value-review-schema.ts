import { z } from "zod";

/** Client review actions only allow confirm/reject transitions from pending. */
export const extractedValueReviewRequestSchema = z
    .object({
        extractedValueId: z.string().trim().min(1).max(128),
        reviewState: z.enum(["confirmed", "rejected"]),
    })
    .strict();
