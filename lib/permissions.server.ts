import "server-only";

import { and, arrayContains, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
    permissionRoles,
    permissions,
    roleUsers,
} from "@/db/schema/identity";

import { ForbiddenError } from "@/lib/auth/errors";
import type { ActionType, AppUser, EntityType } from "@/lib/auth/types";

export async function hasPermission(
    userId: string,
    entity: EntityType,
    action: ActionType,
): Promise<boolean> {
    const db = getDb();

    const rows = await db
        .select({ id: permissions.id })
        .from(roleUsers)
        .innerJoin(
            permissionRoles,
            eq(roleUsers.roleId, permissionRoles.roleId),
        )
        .innerJoin(
            permissions,
            eq(permissionRoles.permissionId, permissions.id),
        )
        .where(
            and(
                eq(roleUsers.userId, userId),
                eq(permissions.entity, entity),
                arrayContains(permissions.actions, [action]),
            ),
        )
        .limit(1);

    return rows.length > 0;
}

export async function requirePermission(
    appUser: AppUser,
    entity: EntityType,
    action: ActionType,
): Promise<AppUser> {
    const allowed = await hasPermission(appUser.id, entity, action);

    if (!allowed) {
        throw new ForbiddenError(`Missing permission: ${entity}:${action}`);
    }

    return appUser;
}
