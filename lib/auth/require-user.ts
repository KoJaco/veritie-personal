import "server-only";

import { DEFAULT_APP_CONFIG, parseAppConfigFromSettings } from "@/lib/domain/app-config";
import { createClient } from "@/lib/supabase/server";

import { findAppUserByAuthId, assertAccountActive } from "./init-account";
import { UnauthorizedError } from "./errors";
import type { AppUser } from "./types";

export async function requireUser(): Promise<AppUser> {
    const supabase = await createClient();
    const {
        data: { user: authUser },
        error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
        throw new UnauthorizedError();
    }

    const row = await findAppUserByAuthId(authUser.id);

    if (!row?.account) {
        throw new UnauthorizedError("App user record not found");
    }

    assertAccountActive(row, row.account);

    const settings = row.account.settings as Record<string, unknown>;
    const appConfig =
        parseAppConfigFromSettings(settings) ?? DEFAULT_APP_CONFIG;

    return {
        id: row.id,
        email: row.email,
        accountId: row.accountId,
        role: row.role,
        plan: row.account.plan,
        appConfig,
    };
}

export async function getOptionalUser(): Promise<AppUser | null> {
    try {
        return await requireUser();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return null;
        }
        throw error;
    }
}
