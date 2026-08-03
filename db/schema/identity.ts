/**
 * Identity, RBAC, billing, and ops tables for multi-tenant accounts.
 * Ported from auth-example/schema.ts (excluding legacy job/media domain).
 */
import {
    pgTable,
    text,
    timestamp,
    uuid,
    boolean,
    index,
    jsonb,
    pgEnum,
    integer,
    primaryKey,
    uniqueIndex,
    check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const timestamps = {
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const subscriptionStatusEnum = pgEnum("subscription_status", [
    "incomplete",
    "incomplete_expired",
    "trialing",
    "active",
    "past_due",
    "canceled",
    "unpaid",
    "paused",
]);

export const userRoleEnum = pgEnum("user_role", [
    "owner",
    "admin",
    "user",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
    "info",
    "success",
    "warning",
    "error",
    "critical",
]);

export const entityEnum = pgEnum("entity", [
    "account",
    "users",
    "roles",
    "permissions",
    "subscriptions",
    "billing",
    "usage_metrics",
    "audit_logs",
    "jobs",
    "captures",
    "clients",
    "tags",
    "share_links",
    "tasks",
    "records",
    "resources",
    "goals",
    "reminders",
    "money_entries",
    "timeline_events",
]);

export const actionEnum = pgEnum("actions", [
    "create",
    "retrieve",
    "update",
    "delete",
]);

export const accounts = pgTable(
    "accounts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        stripeDefaultPaymentMethod: text("stripe_default_payment_method"),
        subscriptionStatus: subscriptionStatusEnum("subscription_status"),
        stripeCustomerId: text("stripe_customer_id").unique(),
        stripeSubscriptionId: text("stripe_subscription_id").unique(),
        trialEndsAt: timestamp("trial_ends_at"),
        plan: text().default("free").notNull(),
        allowPayAsYouGo: boolean("allow_pay_as_you_go").default(false),
        billingCurrency: text("billing_currency").default("AUD"),
        billingCountry: text("billing_country").default("AU"),
        taxExempt: boolean("tax_exempt").default(false),
        seatQuantity: integer("seat_quantity").default(1).notNull(),
        seatLimit: integer("seat_limit"),
        billingEmail: text("billing_email"),
        cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
        currentPeriodStart: timestamp("current_period_start"),
        currentPeriodEnd: timestamp("current_period_end"),
        settings: jsonb("settings").notNull().default({}),
        ...timestamps,
    },
    (table) => ({
        stripeCustomerIdx: index("stripe_customer_idx").on(
            table.stripeCustomerId,
        ),
        stripeSubIdx: index("stripe_sub_idx").on(table.stripeSubscriptionId),
        stripeSubStatusIdx: index("stripe_sub_status_idx").on(
            table.subscriptionStatus,
        ),
        deletedAtIdx: index("accounts_deleted_at_idx").on(table.deletedAt),
        seatQuantityCheck: check(
            "seat_quantity_check",
            sql`${table.seatQuantity} >= 1`,
        ),
        seatLimitCheck: check(
            "seat_limit_check",
            sql`${table.seatLimit} IS NULL OR ${table.seatLimit} >= 1`,
        ),
        currencyCheck: check(
            "currency_check",
            sql`upper(${table.billingCurrency}) = ${table.billingCurrency}`,
        ),
        countryCheck: check(
            "country_check",
            sql`upper(${table.billingCountry}) = ${table.billingCountry}`,
        ),
    }),
);

/** id must match Supabase auth.users.id — set explicitly on OAuth bootstrap */
export const users = pgTable(
    "users",
    {
        id: uuid("id").primaryKey(),
        email: text("email").notNull().unique(),
        provider: text("provider").notNull(),
        providerId: text("provider_id"),
        role: userRoleEnum("role").notNull().default("user"),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        emailVerified: boolean("email_verified").default(false),
        lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
        mfaRequired: boolean("mfa_required").notNull().default(false),
        mfaRequiredReason: text("mfa_required_reason"),
        mfaEnrolled: boolean("mfa_enrolled").notNull().default(false),
        mfaEnrolledAt: timestamp("mfa_enrolled_at", { withTimezone: true }),
        mfaMethod: text("mfa_method"),
        lastMfaAt: timestamp("last_mfa_at", { withTimezone: true }),
        ...timestamps,
    },
    (table) => ({
        userEmailIdx: index("user_email_idx").on(table.email),
        userAccountIdx: index("user_account_idx").on(table.accountId),
        userProviderIdIdx: index("user_provider_id_idx").on(table.providerId),
        deletedAtIdx: index("users_deleted_at_idx").on(table.deletedAt),
    }),
);

export const creditBalances = pgTable("credit_balances", {
    accountId: uuid("account_id")
        .primaryKey()
        .references(() => accounts.id, { onDelete: "cascade" }),
    minuteCredits: integer("minute_credits").notNull().default(0),
    claimCredits: integer("claim_credits").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const creditLedger = pgTable(
    "credit_ledger",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        pool: text("pool").notNull(),
        direction: text("direction").notNull(),
        amount: integer("amount").notNull(),
        reason: text("reason").notNull(),
        jobId: text("job_id"),
        stripeCheckoutSessionId: text("stripe_checkout_session_id"),
        stripePaymentIntentId: text("stripe_payment_intent_id"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => ({
        uniqBySession: uniqueIndex("credit_ledger_checkout_uidx").on(
            t.stripeCheckoutSessionId,
        ),
        uniqByPi: uniqueIndex("credit_ledger_pi_uidx").on(
            t.stripePaymentIntentId,
        ),
        amountCheck: check("credit_ledger_amount_check", sql`${t.amount} > 0`),
        directionCheck: check(
            "credit_ledger_direction_check",
            sql`${t.direction} IN ('credit','debit','reversal')`,
        ),
        poolCheck: check(
            "credit_ledger_pool_check",
            sql`${t.pool} IN ('minutes','claims')`,
        ),
    }),
);

export const usageCounters = pgTable(
    "usage_counters",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        periodStart: timestamp("period_start", {
            withTimezone: true,
        }).notNull(),
        periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
        audioSeconds: integer("audio_seconds").notNull().default(0),
        claimsChecked: integer("claims_checked").notNull().default(0),
        source: text("source").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        accountIdIdx: index("usage_counters_account_id_idx").on(
            table.accountId,
        ),
        uniquePeriodSource: uniqueIndex(
            "usage_counters_unique_period_source",
        ).on(table.accountId, table.source, table.periodStart, table.periodEnd),
        audioSecondsCheck: check(
            "audio_seconds_check",
            sql`${table.audioSeconds} >= 0`,
        ),
        claimsCheckedCheck: check(
            "claims_checked_check",
            sql`${table.claimsChecked} >= 0`,
        ),
        periodBoundsCheck: check(
            "usage_counters_period_bounds_check",
            sql`${table.periodStart} < ${table.periodEnd}`,
        ),
    }),
);

export const usageEvents = pgTable(
    "usage_events",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        usageType: text("usage_type").notNull(),
        quantity: integer("quantity").notNull(),
        jobId: text("job_id").notNull(),
        reportedToStripe: boolean("reported_to_stripe")
            .notNull()
            .default(false),
        reportedMeterEventId: text("reported_meter_event_id"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        accountCreatedAtIdx: index("usage_events_account_created_at_idx").on(
            table.accountId,
            table.createdAt,
        ),
        accountKindIdx: index("usage_events_account_kind_idx").on(
            table.accountId,
            table.usageType,
        ),
        quantityCheck: check("quantity_check", sql`${table.quantity} > 0`),
    }),
);

export const roles = pgTable(
    "roles",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id),
        name: text("name").notNull(),
        description: text("description").default(""),
        accessLevel: integer("access_level").notNull(),
        ...timestamps,
    },
    (table) => ({
        uniqueRoleNameAccount: index("unique_role_name_account").on(
            table.name,
            table.accountId,
        ),
        accountIdIndex: index("roles_account_id_idx").on(table.accountId),
        deletedAtIdx: index("roles_deleted_at_idx").on(table.deletedAt),
    }),
);

export const userInvitations = pgTable(
    "user_invitations",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        email: text("email").notNull(),
        roleId: uuid("role_id")
            .notNull()
            .references(() => roles.id, { onDelete: "cascade" }),
        token: text("token").notNull().unique(),
        invitedBy: uuid("invited_by")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        status: text("status", { enum: ["pending", "accepted", "cancelled"] })
            .notNull()
            .default("pending"),
        ...timestamps,
    },
    (table) => ({
        accountEmailIdx: index("account_email_idx").on(
            table.accountId,
            table.email,
        ),
        deletedAtIdx: index("user_invitations_deleted_at_idx").on(
            table.deletedAt,
        ),
    }),
);

export const userPreferences = pgTable(
    "user_preferences",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        settings: jsonb("settings").notNull().default("{}"),
        userId: uuid("user_id")
            .notNull()
            .unique()
            .references(() => users.id, { onDelete: "cascade" }),
        ...timestamps,
    },
    (table) => ({
        deletedAtIdx: index("user_preferences_deleted_at_idx").on(
            table.deletedAt,
        ),
    }),
);

export const userProfiles = pgTable(
    "user_profiles",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        fullName: text("full_name"),
        avatarBlob: text("avatarBlob"),
        bio: text("bio"),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        ...timestamps,
    },
    (table) => ({
        deletedAtIdx: index("user_profiles_deleted_at_idx").on(table.deletedAt),
    }),
);

export const roleUsers = pgTable(
    "role_users",
    {
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id),
        roleId: uuid("role_id")
            .notNull()
            .references(() => roles.id, { onDelete: "cascade" }),
        assignedBy: uuid("assigned_by").references(() => users.id),
        assignedAt: timestamp("assigned_at", {
            withTimezone: true,
        }).defaultNow(),
        ...timestamps,
    },
    (table) => ({
        pk: primaryKey({
            columns: [table.userId, table.roleId],
        }),
        uniqueConstraint: index("role_users_unique_idx").on(
            table.userId,
            table.roleId,
        ),
        userIdIndex: index("user_id_idx").on(table.userId),
        deletedAtIdx: index("role_users_deleted_at_idx").on(table.deletedAt),
    }),
);

export const permissions = pgTable(
    "permissions",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, {
                onDelete: "cascade",
            }),
        entity: entityEnum("entity"),
        actions: actionEnum("actions").array(),
        description: text("description").default(""),
        isCritical: boolean("is_critical").default(false),
        isOwnerOnly: boolean("is_owner_only").default(false),
        ...timestamps,
    },
    (table) => ({
        accountIdIndex: index("permissions_account_id_idx").on(table.accountId),
        deletedAtIdx: index("permissions_deleted_at_idx").on(table.deletedAt),
    }),
);

export const permissionRoles = pgTable(
    "permission_roles",
    {
        roleId: uuid("role_id")
            .notNull()
            .references(() => roles.id, { onDelete: "cascade" }),
        permissionId: uuid("permission_id")
            .notNull()
            .references(() => permissions.id),
        ...timestamps,
    },
    (table) => ({
        pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
        roleIdIndex: index("permission_roles_role_id_idx").on(table.roleId),
        deletedAtIdx: index("permission_roles_deleted_at_idx").on(
            table.deletedAt,
        ),
    }),
);

export const plans = pgTable(
    "plans",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        stripeId: text("stripe_id").notNull().unique(),
        name: text("name").notNull(),
        description: text("description"),
        isActive: boolean("is_active").default(true),
        ...timestamps,
    },
    (table) => ({
        plansStripeIdIdx: index("plans_stripe_id_idx").on(table.stripeId),
        deletedAtIdx: index("plans_deleted_at_idx").on(table.deletedAt),
    }),
);

export const prices = pgTable(
    "prices",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        stripeId: text("stripe_id").notNull().unique(),
        amount: integer("amount").notNull(),
        currency: text("currency").notNull(),
        interval: text("interval").notNull(),
        planId: uuid("plan_id")
            .notNull()
            .references(() => plans.id),
        isActive: boolean("is_active").default(true),
        ...timestamps,
    },
    (table) => ({
        pricesStripeIdIdx: index("prices_stripe_id_idx").on(table.stripeId),
        pricesPlanIdIdx: index("prices_plan_id_idx").on(table.planId),
        deletedAtIdx: index("prices_deleted_at_idx").on(table.deletedAt),
    }),
);

export const subscriptions = pgTable(
    "subscriptions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        stripeId: text("stripe_id").notNull().unique(),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id),
        planId: uuid("plan_id")
            .notNull()
            .references(() => plans.id),
        status: subscriptionStatusEnum("subscription_status").notNull(),
        currentPeriodStart: timestamp("current_period_start").notNull(),
        currentPeriodEnd: timestamp("current_period_end").notNull(),
        cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
        ...timestamps,
    },
    (table) => ({
        subscriptionsStripeIdIdx: index("subscriptions_stripe_id_idx").on(
            table.stripeId,
        ),
        subscriptionsAccountIdIdx: index("subscriptions_account_id_idx").on(
            table.accountId,
        ),
        deletedAtIdx: index("subscriptions_deleted_at_idx").on(table.deletedAt),
    }),
);

export const subscriptionItems = pgTable(
    "subscription_items",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        stripe_id: text("stripe_id").notNull(),
        subscriptionId: uuid("subscription_id")
            .notNull()
            .references(() => subscriptions.id),
        priceId: uuid("price_id")
            .notNull()
            .references(() => prices.id),
        quantity: integer("quantity").default(1).notNull(),
        ...timestamps,
    },
    (table) => ({
        deletedAtIdx: index("subscription_items_deleted_at_idx").on(
            table.deletedAt,
        ),
    }),
);

export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
    id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    stripeId: text("stripe_id").notNull().unique(),
    type: text("type").notNull(),
    data: jsonb("data").notNull(),
    processed: boolean("processed").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const usageMetrics = pgTable(
    "usage_metrics",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        userId: uuid("user_id").references(() => users.id),
        metricType: text("metric_type").notNull(),
        data: jsonb("data").default("{}"),
        ...timestamps,
    },
    (table) => ({
        deletedAtIdx: index("usage_metrics_deleted_at_idx").on(table.deletedAt),
    }),
);

export const webhookEvents = pgTable(
    "webhook_events",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        eventId: text("event_id").notNull(),
        source: text("source").notNull(),
        eventType: text("event_type").notNull(),
        processed: boolean("processed").notNull().default(false),
        processedAt: timestamp("processed_at", { withTimezone: true }),
        payload: jsonb("payload").notNull(),
        metadata: jsonb("metadata").default("{}"),
        error: text("error"),
        retryCount: integer("retry_count").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        eventIdIdx: uniqueIndex("webhook_events_event_id_idx").on(
            table.eventId,
            table.source,
        ),
        sourceIdx: index("webhook_events_source_idx").on(table.source),
        eventTypeIdx: index("webhook_events_event_type_idx").on(
            table.eventType,
        ),
        processedIdx: index("webhook_events_processed_idx").on(table.processed),
        createdAtIdx: index("webhook_events_created_at_idx").on(
            table.createdAt,
        ),
    }),
);

export const notifications = pgTable(
    "notifications",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        userId: uuid("user_id").references(() => users.id, {
            onDelete: "cascade",
        }),
        roleIds: uuid("role_ids").array(),
        type: notificationTypeEnum("type").notNull(),
        title: text("title").notNull(),
        message: text("message").notNull(),
        actionUrl: text("action_url"),
        actionLabel: text("action_label"),
        metadata: jsonb("metadata").default("{}"),
        read: boolean("read").notNull().default(false),
        readAt: timestamp("read_at", { withTimezone: true }),
        ...timestamps,
    },
    (table) => ({
        accountIdIdx: index("notifications_account_id_idx").on(table.accountId),
        userIdIdx: index("notifications_user_id_idx").on(table.userId),
        readIdx: index("notifications_read_idx").on(table.read),
        typeIdx: index("notifications_type_idx").on(table.type),
        createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
        userReadIdx: index("notifications_user_read_idx").on(
            table.userId,
            table.read,
        ),
        accountReadIdx: index("notifications_account_read_idx").on(
            table.accountId,
            table.read,
        ),
    }),
);

export const auditLogs = pgTable(
    "audit_logs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        actorUserId: uuid("actor_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        action: text("action").notNull(),
        targetType: text("target_type").notNull(),
        targetId: uuid("target_id"),
        changes: jsonb("changes").default("{}"),
        metadata: jsonb("metadata").default("{}"),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        actorUserIdIdx: index("audit_logs_actor_user_id_idx").on(
            table.actorUserId,
        ),
        accountIdIdx: index("audit_logs_account_id_idx").on(table.accountId),
        targetTypeIdx: index("audit_logs_target_type_idx").on(table.targetType),
        targetIdIdx: index("audit_logs_target_id_idx").on(table.targetId),
        actionIdx: index("audit_logs_action_idx").on(table.action),
        createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
        accountCreatedAtIdx: index("audit_logs_account_created_at_idx").on(
            table.accountId,
            table.createdAt,
        ),
    }),
);

export const usersRelations = relations(users, ({ one }) => ({
    account: one(accounts, {
        fields: [users.accountId],
        references: [accounts.id],
    }),
}));

export const accountsRelations = relations(accounts, ({ many }) => ({
    users: many(users),
    subscriptions: many(subscriptions),
}));

export const userInvitationsRelations = relations(
    userInvitations,
    ({ one }) => ({
        account: one(accounts, {
            fields: [userInvitations.accountId],
            references: [accounts.id],
        }),
        invitedByUser: one(users, {
            fields: [userInvitations.invitedBy],
            references: [users.id],
        }),
        role: one(roles, {
            fields: [userInvitations.roleId],
            references: [roles.id],
        }),
    }),
);

export const rolesRelations = relations(roles, ({ one, many }) => ({
    account: one(accounts, {
        fields: [roles.accountId],
        references: [accounts.id],
    }),
    rolePermissions: many(permissionRoles),
    roleUsers: many(roleUsers),
}));

export const roleUsersRelations = relations(roleUsers, ({ one }) => ({
    user: one(users, {
        fields: [roleUsers.userId],
        references: [users.id],
    }),
    role: one(roles, {
        fields: [roleUsers.roleId],
        references: [roles.id],
    }),
    assignedByUser: one(users, {
        fields: [roleUsers.assignedBy],
        references: [users.id],
    }),
}));

export const permissionsRelations = relations(permissions, ({ one, many }) => ({
    permissionRoles: many(permissionRoles),
    account: one(accounts, {
        fields: [permissions.accountId],
        references: [accounts.id],
    }),
}));

export const permissionRolesRelations = relations(
    permissionRoles,
    ({ one }) => ({
        role: one(roles, {
            fields: [permissionRoles.roleId],
            references: [roles.id],
        }),
        permission: one(permissions, {
            fields: [permissionRoles.permissionId],
            references: [permissions.id],
        }),
    }),
);

export const plansRelations = relations(plans, ({ many }) => ({
    prices: many(prices),
    subscriptions: many(subscriptions),
}));

export const pricesRelations = relations(prices, ({ one }) => ({
    plan: one(plans, {
        fields: [prices.planId],
        references: [plans.id],
    }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    account: one(accounts, {
        fields: [subscriptions.accountId],
        references: [accounts.id],
    }),
    plan: one(plans, {
        fields: [subscriptions.planId],
        references: [plans.id],
    }),
}));

export const subscriptionItemsRelations = relations(
    subscriptionItems,
    ({ one }) => ({
        subscription: one(subscriptions, {
            fields: [subscriptionItems.subscriptionId],
            references: [subscriptions.id],
        }),
        price: one(prices, {
            fields: [subscriptionItems.priceId],
            references: [prices.id],
        }),
    }),
);

export const usageMetricsRelations = relations(usageMetrics, ({ one }) => ({
    user: one(users, {
        fields: [usageMetrics.userId],
        references: [users.id],
    }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    account: one(accounts, {
        fields: [notifications.accountId],
        references: [accounts.id],
    }),
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    actor: one(users, {
        fields: [auditLogs.actorUserId],
        references: [users.id],
    }),
    account: one(accounts, {
        fields: [auditLogs.accountId],
        references: [accounts.id],
    }),
}));
