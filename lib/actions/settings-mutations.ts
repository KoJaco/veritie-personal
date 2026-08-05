"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getDataSourceKind } from "@/lib/data-source/registry";
import { requireAccountScope } from "@/lib/db/repositories/context";
import {
    softDeleteAccount,
    updateAccountName,
    updateUserProfileFullName,
} from "@/lib/db/repositories/settings";
import {
    deleteAccountInputSchema,
    updateProfileInputSchema,
} from "@/lib/settings/update-profile-schema";

export type SettingsActionResult =
    | { ok: true }
    | { ok: false; error: string };

export async function updateProfileAction(input: {
    displayName: string;
    workspaceName?: string;
}): Promise<SettingsActionResult> {
    const user = await requireUser();

    if (getDataSourceKind() !== "backend") {
        return {
            ok: false,
            error: "Account changes require database-backed mode",
        };
    }

    const parsed = updateProfileInputSchema.safeParse(input);
    if (!parsed.success) {
        return { ok: false, error: "Invalid profile payload" };
    }

    const scope = await requireAccountScope();

    const displayUpdated = await updateUserProfileFullName(
        scope,
        parsed.data.displayName,
    );
    if (!displayUpdated) {
        return { ok: false, error: "Could not update display name" };
    }

    if (user.role === "owner" && parsed.data.workspaceName) {
        const accountUpdated = await updateAccountName(
            scope,
            parsed.data.workspaceName,
        );
        if (!accountUpdated) {
            return { ok: false, error: "Could not update workspace name" };
        }
    }

    return { ok: true };
}

export async function deleteAccountAction(input: {
    confirmation: string;
}): Promise<SettingsActionResult> {
    const user = await requireUser();

    if (user.role !== "owner") {
        return {
            ok: false,
            error: "Only account owners can delete accounts",
        };
    }

    if (getDataSourceKind() !== "backend") {
        return {
            ok: false,
            error: "Account deletion requires database-backed mode",
        };
    }

    const parsed = deleteAccountInputSchema.safeParse(input);
    if (!parsed.success) {
        return {
            ok: false,
            error: "Confirmation text does not match",
        };
    }

    const scope = await requireAccountScope();
    const deleted = await softDeleteAccount(scope);
    if (!deleted) {
        return { ok: false, error: "Account could not be deleted" };
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.auth.signOut();

    redirect(
        "/auth/error?error=account_deleted&message=This+account+was+deleted.",
    );
}
