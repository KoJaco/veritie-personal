import "server-only";

import { getDb } from "@/lib/db";
import {
    accounts,
    auditLogs,
    creditBalances,
    permissionRoles,
    permissions,
    roleUsers,
    roles,
    userPreferences,
    userProfiles,
    users,
} from "@/db/schema/identity";
import {
    buildAccountSettings,
    buildBillingConfig,
} from "@/lib/domain/billing-config";
import { resolveAppConfig } from "@/lib/domain/app-config";

import { assertAccountActive, isAccountDeleted, isUserDeleted } from "./deleted-account";
import {
    DuplicateUserError,
    InitAccountError,
} from "./errors";
import {
    buildPermissionCatalog,
    isOwnerGrantedEntity,
    OWNER_ROLE_ACCESS_LEVEL,
    OWNER_ROLE_NAME,
} from "./permission-seed";
import type {
    EntityType,
    InitAccountWithUserInput,
    InitAccountWithUserResult,
} from "./types";

export function deriveAccountNameFromEmail(email: string): string {
    const emailPrefix = email.split("@")[0] ?? "user";
    const normalized = emailPrefix
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50);

    return normalized || "user";
}

function isUniqueViolation(error: unknown): boolean {
    return (
        error !== null &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "23505"
    );
}

export async function initAccountWithUser(
    input: InitAccountWithUserInput,
): Promise<InitAccountWithUserResult> {
    const db = getDb();
    const appConfig = resolveAppConfig(input.onboardingProfile ?? null, true);
    const billing = buildBillingConfig("free");
    const settings = buildAccountSettings(appConfig, billing);

    try {
        return await db.transaction(async (tx) => {
            const [account] = await tx
                .insert(accounts)
                .values({
                    name: input.accountName,
                    plan: "free",
                    settings,
                })
                .returning({ id: accounts.id });

            await tx.insert(users).values({
                id: input.authUserId,
                email: input.email,
                provider: input.provider,
                providerId: input.providerId,
                role: "owner",
                accountId: account.id,
                emailVerified: input.emailVerified,
                lastLoginAt: new Date(),
            });

            await tx.insert(userProfiles).values({
                userId: input.authUserId,
            });

            await tx.insert(userPreferences).values({
                userId: input.authUserId,
                settings: {},
            });

            const [ownerRole] = await tx
                .insert(roles)
                .values({
                    accountId: account.id,
                    name: OWNER_ROLE_NAME,
                    description: "Account owner with full workspace access",
                    accessLevel: OWNER_ROLE_ACCESS_LEVEL,
                })
                .returning({ id: roles.id });

            await tx.insert(roleUsers).values({
                userId: input.authUserId,
                roleId: ownerRole.id,
                assignedBy: input.authUserId,
            });

            const catalog = buildPermissionCatalog();
            const insertedPermissions = await tx
                .insert(permissions)
                .values(
                    catalog.map((row) => ({
                        accountId: account.id,
                        entity: row.entity,
                        actions: row.actions,
                        description: row.description,
                        isCritical: row.isCritical ?? false,
                        isOwnerOnly: row.isOwnerOnly ?? false,
                    })),
                )
                .returning({
                    id: permissions.id,
                    entity: permissions.entity,
                });

            const grantedPermissionRows = insertedPermissions.filter((row) =>
                isOwnerGrantedEntity(row.entity as EntityType),
            );

            if (grantedPermissionRows.length > 0) {
                await tx.insert(permissionRoles).values(
                    grantedPermissionRows.map((row) => ({
                        roleId: ownerRole.id,
                        permissionId: row.id,
                    })),
                );
            }

            await tx.insert(creditBalances).values({
                accountId: account.id,
                minuteCredits: 0,
                claimCredits: 0,
            });

            await tx.insert(auditLogs).values({
                actorUserId: input.authUserId,
                accountId: account.id,
                action: "account.created",
                targetType: "accounts",
                targetId: account.id,
                changes: {},
                metadata: {
                    source: "init_account",
                    provider: input.provider,
                },
            });

            return {
                accountId: account.id,
                userId: input.authUserId,
                roleId: ownerRole.id,
            };
        });
    } catch (error) {
        if (isUniqueViolation(error)) {
            throw new DuplicateUserError();
        }

        throw new InitAccountError(
            error instanceof Error
                ? error.message
                : "Failed to initialize account",
        );
    }
}

export async function findAppUserByAuthId(authUserId: string) {
    const db = getDb();
    const row = await db.query.users.findFirst({
        where: (usersTable, { eq: equals }) => equals(usersTable.id, authUserId),
        with: {
            account: true,
        },
    });

    if (!row?.account) {
        return null;
    }

    return row;
}

export { isAccountDeleted, isUserDeleted, assertAccountActive };
