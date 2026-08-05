import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { accounts, userProfiles, users } from "@/db/schema/identity";
import { getDb } from "@/lib/db";
import type { SettingsStub } from "@/lib/stubs/types";

import type { AccountScope } from "./context";

export async function getSettings(scope: AccountScope): Promise<SettingsStub> {
    const db = getDb();
    const user = await db.query.users.findFirst({
        where: and(
            eq(users.id, scope.userId),
            eq(users.accountId, scope.accountId),
        ),
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
            workspaceName: account?.name ?? "",
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

export async function updateUserProfileFullName(
    scope: AccountScope,
    fullName: string,
): Promise<boolean> {
    const db = getDb();
    const now = new Date();

    const updated = await db
        .update(userProfiles)
        .set({
            fullName,
            updatedAt: now,
        })
        .where(eq(userProfiles.userId, scope.userId))
        .returning({ id: userProfiles.id });

    if (updated.length === 0) {
        const user = await db.query.users.findFirst({
            where: and(
                eq(users.id, scope.userId),
                eq(users.accountId, scope.accountId),
            ),
            columns: { id: true },
        });
        if (!user) {
            return false;
        }

        await db.insert(userProfiles).values({
            userId: scope.userId,
            fullName,
            createdAt: now,
            updatedAt: now,
        });
        return true;
    }

    return true;
}

export async function updateAccountName(
    scope: AccountScope,
    name: string,
): Promise<boolean> {
    const db = getDb();
    const now = new Date();

    const updated = await db
        .update(accounts)
        .set({
            name,
            updatedAt: now,
        })
        .where(eq(accounts.id, scope.accountId))
        .returning({ id: accounts.id });

    return updated.length > 0;
}

export async function softDeleteAccount(scope: AccountScope): Promise<boolean> {
    const db = getDb();
    const now = new Date();

    await db
        .update(users)
        .set({
            deletedAt: now,
            updatedAt: now,
        })
        .where(
            and(
                eq(users.accountId, scope.accountId),
                isNull(users.deletedAt),
            ),
        );

    const updatedAccounts = await db
        .update(accounts)
        .set({
            deletedAt: now,
            updatedAt: now,
        })
        .where(
            and(eq(accounts.id, scope.accountId), isNull(accounts.deletedAt)),
        )
        .returning({ id: accounts.id });

    return updatedAccounts.length > 0;
}

