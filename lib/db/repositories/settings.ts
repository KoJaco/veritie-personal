import "server-only";

import { eq } from "drizzle-orm";

import { accounts, userProfiles, users } from "@/db/schema/identity";
import { getDb } from "@/lib/db";
import type { SettingsStub } from "@/lib/stubs/types";

import type { AccountScope } from "./context";

export async function getSettings(scope: AccountScope): Promise<SettingsStub> {
    const db = getDb();
    const user = await db.query.users.findFirst({
        where: eq(users.id, scope.userId),
    });
    const account = await db.query.accounts.findFirst({
        where: eq(accounts.id, scope.accountId),
    });
    const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, scope.userId),
    });

    const email = user?.email ?? "";
    const displayName =
        profile?.fullName ?? email.split("@")[0] ?? "User";
    const roleLabel =
        user?.role === "owner"
            ? "Owner"
            : user?.role === "admin"
              ? "Admin"
              : "Member";

    return {
        profile: {
            name: displayName,
            email,
            role: roleLabel,
            lastLoginAt: user?.lastLoginAt
                ? user.lastLoginAt.toISOString()
                : new Date().toISOString(),
        },
        team: [],
        capabilities: [],
        scopeMapping: {
            mappingStatus: "valid",
            topValidationErrors: [],
        },
        frameworkConfiguration: {
            soc2: {
                mappingStatus: "valid",
                topValidationErrors: [],
            },
        },
    };
}
