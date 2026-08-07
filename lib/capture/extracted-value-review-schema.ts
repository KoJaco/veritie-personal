import { z } from "zod";

/** Client review targets: confirm/reject from pending, rollback to pending from terminal states. */
export const extractedValueReviewRequestSchema = z
    .object({
        extractedValueId: z.string().trim().min(1).max(128),
        reviewState: z.enum(["confirmed", "rejected", "pending"]),
    })
    .strict();
