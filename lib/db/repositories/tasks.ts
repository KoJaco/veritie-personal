import "server-only";

import { and, eq } from "drizzle-orm";

import { tasks } from "@/db/schema/objects";
import { users } from "@/db/schema/identity";
import { getDb } from "@/lib/db";
import type { TasksIndexQuery } from "@/lib/data-source/tasks-read-model";
import {
    applyTasksIndexQuery,
    isTaskOverdue,
    mapTaskStatusToUi,
    type TaskDetailReadModel,
    type TaskIndexItemReadModel,
} from "@/lib/data-source/tasks-read-model";
import type { TaskStatus } from "@/lib/stubs";
import type { ScopeKey } from "@/lib/lens";
import { aspectIdsToLabels } from "@/lib/aspect/definitions";

import type { AccountScope } from "./context";

function toIso(date: Date | null | undefined): string | null {
    if (!date) return null;
    return date instanceof Date ? date.toISOString() : String(date);
}

function mapTaskRowToDetail(
    row: typeof tasks.$inferSelect,
    owner: { id: string; email: string; name: string },
): TaskDetailReadModel {
    const scopeIds = [row.aspect as ScopeKey];
    const status = mapTaskStatusToUi(row.status as TaskStatus);
    const dueAt = toIso(row.dueAt);
    const updatedAt = toIso(row.updatedAt) ?? new Date().toISOString();

    const base: TaskIndexItemReadModel = {
        id: row.id,
        title: row.title,
        status,
        sourceStatus: row.status as TaskStatus,
        dueAt,
        owner: {
            id: owner.id,
            name: owner.name,
            email: owner.email,
            isMe: true,
        },
        check: {
            id: `${row.id}_check`,
            title: "Personal task",
        },
        scopeLabels: aspectIdsToLabels(scopeIds),
        scopeIds,
        attachmentCount: 0,
        missingAttachmentCount: 0,
        updatedAt,
        isOverdue: isTaskOverdue(dueAt, status, new Date()),
    };

    return {
        ...base,
        description: row.notes ?? "",
        checkContext: "Personal workspace task.",
        documents: [],
        attachments: [],
        activity: [],
        blockers: [],
    };
}

export async function getTasksIndex(
    scope: AccountScope,
    query?: TasksIndexQuery,
) {
    const db = getDb();
    const owner = await db.query.users.findFirst({
        where: eq(users.id, scope.userId),
    });

    const ownerSummary = {
        id: scope.userId,
        name: owner?.email?.split("@")[0] ?? "You",
        email: owner?.email ?? "",
        isMe: true,
    };

    const rows = await db
        .select()
        .from(tasks)
        .where(eq(tasks.accountId, scope.accountId));

    const items = rows.map((row) =>
        mapTaskRowToDetail(row, {
            id: ownerSummary.id,
            email: ownerSummary.email,
            name: ownerSummary.name,
        }),
    );

    return applyTasksIndexQuery(items, new Date(), query);
}

export async function getTaskDetail(scope: AccountScope, id: string) {
    const db = getDb();
    const row = await db.query.tasks.findFirst({
        where: and(eq(tasks.accountId, scope.accountId), eq(tasks.id, id)),
    });

    if (!row) {
        return null;
    }

    const owner = await db.query.users.findFirst({
        where: eq(users.id, scope.userId),
    });

    return mapTaskRowToDetail(row, {
        id: scope.userId,
        email: owner?.email ?? "",
        name: owner?.email?.split("@")[0] ?? "You",
    });
}
