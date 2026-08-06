import { z } from "zod";

export const DELETE_ACCOUNT_CONFIRMATION = "Delete this account";

export const updateProfileInputSchema = z.object({
    displayName: z.string().trim().min(1).max(128),
    workspaceName: z.string().trim().min(1).max(128).optional(),
});

export const deleteAccountInputSchema = z.object({
    confirmation: z.literal(DELETE_ACCOUNT_CONFIRMATION),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
