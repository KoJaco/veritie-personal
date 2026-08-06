/**
 * Drizzle schema — projected domain objects (tasks, reminders, goals, money, records, resources).
 * Target: PostgreSQL on Supabase.
 */
import {
    pgTable,
    text,
    timestamp,
    integer,
    doublePrecision,
    boolean,
    jsonb,
    index,
} from "drizzle-orm/pg-core";

import { accountIdColumn } from "./tenancy";

export const tasks = pgTable(
    "tasks",
    {
        id: text("id").primaryKey(),
        accountId: accountIdColumn(),
        title: text("title").notNull(),
        notes: text("notes"),
        aspect: text("aspect").notNull(),
        status: text("status").notNull(),
        priority: text("priority").notNull(),
        dueAt: timestamp("due_at", { withTimezone: true }),
        scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
        waitingOn: text("waiting_on"),
        sourceCaptureIds: jsonb("source_capture_ids")
            .$type<string[]>()
            .notNull()
            .default([]),
        sourceValueIds: jsonb("source_value_ids")
            .$type<string[]>()
            .notNull()
            .default([]),
        relatedGoalIds: jsonb("related_goal_ids")
            .$type<string[]>()
            .notNull()
            .default([]),
        relatedResourceIds: jsonb("related_resource_ids")
            .$type<string[]>()
            .notNull()
            .default([]),
        relatedRecordIds: jsonb("related_record_ids")
            .$type<string[]>()
            .notNull()
            .default([]),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    },
    (table) => [
        index("tasks_status_idx").on(table.status),
        index("tasks_account_id_idx").on(table.accountId),
    ],
);

export const reminders = pgTable("reminders", {
    id: text("id").primaryKey(),
    accountId: accountIdColumn(),
    title: text("title").notNull(),
    remindAt: timestamp("remind_at", { withTimezone: true }).notNull(),
    recurrence: text("recurrence"),
    aspect: text("aspect").notNull(),
    status: text("status").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    sourceCaptureIds: jsonb("source_capture_ids")
        .$type<string[]>()
        .notNull()
        .default([]),
    sourceValueIds: jsonb("source_value_ids")
        .$type<string[]>()
        .notNull()
        .default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const goals = pgTable("goals", {
    id: text("id").primaryKey(),
    accountId: accountIdColumn(),
    title: text("title").notNull(),
    aspect: text("aspect").notNull(),
    status: text("status").notNull(),
    targetType: text("target_type").notNull(),
    targetValue: doublePrecision("target_value"),
    currentValue: doublePrecision("current_value"),
    unit: text("unit"),
    startDate: timestamp("start_date", { withTimezone: true }),
    targetDate: timestamp("target_date", { withTimezone: true }),
    cadence: text("cadence"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const goalProgressEntries = pgTable("goal_progress_entries", {
    id: text("id").primaryKey(),
    accountId: accountIdColumn(),
    goalId: text("goal_id")
        .notNull()
        .references(() => goals.id),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    valueDelta: doublePrecision("value_delta"),
    valueSnapshot: doublePrecision("value_snapshot"),
    note: text("note"),
    confidence: doublePrecision("confidence"),
    sourceCaptureIds: jsonb("source_capture_ids")
        .$type<string[]>()
        .notNull()
        .default([]),
    sourceValueIds: jsonb("source_value_ids")
        .$type<string[]>()
        .notNull()
        .default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const moneyEntries = pgTable("money_entries", {
    id: text("id").primaryKey(),
    accountId: accountIdColumn(),
    type: text("type").notNull(),
    amount: doublePrecision("amount").notNull(),
    currency: text("currency").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    merchantOrPayee: text("merchant_or_payee"),
    category: text("category"),
    aspect: text("aspect").notNull(),
    paymentMethod: text("payment_method"),
    reimbursable: boolean("reimbursable"),
    status: text("status").notNull(),
    sourceCaptureIds: jsonb("source_capture_ids")
        .$type<string[]>()
        .notNull()
        .default([]),
    sourceValueIds: jsonb("source_value_ids")
        .$type<string[]>()
        .notNull()
        .default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const records = pgTable("records", {
    id: text("id").primaryKey(),
    accountId: accountIdColumn(),
    title: text("title").notNull(),
    kind: text("kind").notNull(),
    aspect: text("aspect").notNull(),
    markdownContent: text("markdown_content"),
    sourceCaptureIds: jsonb("source_capture_ids")
        .$type<string[]>()
        .notNull()
        .default([]),
    sourceValueIds: jsonb("source_value_ids")
        .$type<string[]>()
        .notNull()
        .default([]),
    relatedTaskIds: jsonb("related_task_ids")
        .$type<string[]>()
        .notNull()
        .default([]),
    relatedGoalIds: jsonb("related_goal_ids")
        .$type<string[]>()
        .notNull()
        .default([]),
    relatedResourceIds: jsonb("related_resource_ids")
        .$type<string[]>()
        .notNull()
        .default([]),
    relatedMoneyEntryIds: jsonb("related_money_entry_ids")
        .$type<string[]>()
        .notNull()
        .default([]),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const resources = pgTable("resources", {
    id: text("id").primaryKey(),
    accountId: accountIdColumn(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    summary: text("summary"),
    aspectIds: jsonb("aspect_ids").$type<string[]>().notNull().default([]),
    sourceCaptureIds: jsonb("source_capture_ids")
        .$type<string[]>()
        .notNull()
        .default([]),
    sourceValueIds: jsonb("source_value_ids")
        .$type<string[]>()
        .notNull()
        .default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
