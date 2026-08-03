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
    numeric,
    uniqueIndex,
    check,
    smallserial,
    type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Standard timestamp columns for soft-delete support
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
    "owner", // Account owner with full permissions
    "admin", // Can manage users and settings
    "user", // Regular user with basic access
]);

export const notificationTypeEnum = pgEnum("notification_type", [
    "info", // general info (task update, role assignment, etc)
    "success", // positive actions (task complete, etc)
    "warning", // potential issues
    "error", // errors or critical alerts
    "critical", // high-priority critical alerts
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
]);

export const actionEnum = pgEnum("actions", [
    "create",
    "retrieve",
    "update",
    "delete",
]);

export const galleryOrderingModeEnum = pgEnum("gallery_ordering_mode", [
    "capture_timestamp",
    "saved_at",
    "custom",
]);

export const galleryOrderingDirectionEnum = pgEnum(
    "gallery_ordering_direction",
    ["asc", "desc"],
);

export const contactEnquirySourceEnum = pgEnum("contact_enquiry_source", [
    "public",
    "dashboard",
]);

export const contactEnquiryStatusEnum = pgEnum("contact_enquiry_status", [
    "open",
    "closed",
    "spam",
]);

export const contactEnquiryCategoryEnum = pgEnum("contact_enquiry_category", [
    "general",
    "feature_request",
    "bug_report",
    "help_with_app",
]);

// Before & After MVP Domain Enums
// NOTE: blockTypeEnum is deprecated - blocks no longer have fixed types
// Kept for backward compatibility during migration

// Job element type enum
// Defines the types of elements that can be added to a job
export const jobElementTypeEnum = pgEnum("job_element_type", [
    "rich_text",
    "gallery",
    "voice_logs",
]);

/**
 * Job status enum
 * - draft: job is open and editable
 * - active: job is actively being worked
 * - closed: job is completed
 *
 * client_id is optional across all statuses.
 */
export const jobStatusEnum = pgEnum("job_status", [
    "draft",
    "active",
    "closed",
]);

export const uploadStatusEnum = pgEnum("upload_status", [
    "pending",
    "uploading",
    "completed",
    "failed",
]);

export const variantStatusEnum = pgEnum("variant_status", [
    "pending",
    "processing",
    "ready",
    "failed",
]);

export const voiceLogStatusEnum = pgEnum("voice_log_status", [
    "preparing",
    "recording",
    "uploading",
    "processing",
    "transcript_ready",
    "completed",
    "partial_success",
    "failed",
    "cancelled",
]);

export const mediaProcessingSourceTypeEnum = pgEnum(
    "media_processing_source_type",
    ["capture", "media"],
);

export const mediaProcessingJobStatusEnum = pgEnum(
    "media_processing_job_status",
    ["pending", "processing", "completed", "failed"],
);

export const jobItemVisibilityEnum = pgEnum("job_item_visibility", [
    "visible",
    "hidden",
]);

// Users table
export const users = pgTable(
    "users",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        email: text("email").notNull().unique(),
        provider: text("provider").notNull(),
        providerId: text("provider_id"),
        role: userRoleEnum("role").notNull().default("user"),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        emailVerified: boolean("email_verified").default(false),
        lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
        // MFA fields
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

// Accounts table
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

/** Fast-read running balances per account */
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

/** Append-only ledger to audit all credit movements */
export const creditLedger = pgTable(
    "credit_ledger",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),

        /** 'minutes' | 'claims' */
        pool: text("pool").notNull(),
        /** 'credit' | 'debit' | 'reversal' */
        direction: text("direction").notNull(),
        amount: integer("amount").notNull(), // positive integer

        reason: text("reason").notNull(), // e.g. 'topup', 'usage:audio', 'usage:claims', 'refund', 'dispute_freeze'
        jobId: text("job_id"), // optional: link to processing job

        // Idempotency / traceability
        stripeCheckoutSessionId: text("stripe_checkout_session_id"),
        stripePaymentIntentId: text("stripe_payment_intent_id"),

        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => ({
        // Ensure we don't double-credit on webhook retries
        uniqBySession: uniqueIndex("credit_ledger_checkout_uidx").on(
            t.stripeCheckoutSessionId,
        ),
        uniqByPi: uniqueIndex("credit_ledger_pi_uidx").on(
            t.stripePaymentIntentId,
        ),
        // Basic checks
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

        usageType: text("usage_type").notNull(), // should really be an enum
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

// User invitations
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

// Relations
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
    }),
);

// * * * * * * * * *
// Role-based Tables
// * * * * * * * * *

// Roles table
export const roles = pgTable(
    "roles",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`gen_random_uuid()`),

        // Foreign key to 'accounts.id' (Many-to-one relationship)
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id),

        name: text("name").notNull(),
        description: text("description").default(""),
        accessLevel: integer("access_level").notNull(), // do not allow entities that are lower in the hierarchy to access data in entities that are higher... 'owner', 'admin', 'user'

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

// RoleUsers table
export const roleUsers = pgTable(
    "role_users",
    {
        // Foreign key to 'users.id'
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id),

        // Foreign key to 'roles.id'
        roleId: uuid("role_id")
            .notNull()
            .references(() => roles.id, { onDelete: "cascade" }), // when a role is deleted, remove the related role-user assignment

        assignedBy: uuid("assigned_by").references(() => users.id),

        assignedAt: timestamp("assigned_at", {
            withTimezone: true,
        }).defaultNow(),

        ...timestamps,
    },
    (table) => ({
        // Composite primary key to prevent duplicate role assignments
        pk: primaryKey({
            columns: [table.userId, table.roleId],
        }),
        uniqueConstraint: index("role_users_unique_idx").on(
            table.userId,
            table.roleId,
        ),
        // speed up has_permission() check
        userIdIndex: index("user_id_idx").on(table.userId),
        deletedAtIdx: index("role_users_deleted_at_idx").on(table.deletedAt),
    }),
);

// Permissions table
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
        isOwnerOnly: boolean("is_owner_only").default(false), // Only visible to owners
        ...timestamps,
    },
    (table) => ({
        accountIdIndex: index("permissions_account_id_idx").on(table.accountId),
        deletedAtIdx: index("permissions_deleted_at_idx").on(table.deletedAt),
    }),
);

// RolePermissions Many-to-many table
export const permissionRoles = pgTable(
    "permission_roles",
    {
        // Foreign key to 'roles.id' (Many-to-one relationship)
        roleId: uuid("role_id")
            .notNull()
            .references(() => roles.id, { onDelete: "cascade" }),

        // Foreign key to 'permissions.id' (Many-to-one relationship)
        permissionId: uuid("permission_id")
            .notNull()
            .references(() => permissions.id),

        ...timestamps,
    },
    (table) => ({
        pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
        roleIdIndex: index("role_id_idx").on(table.roleId),
        deletedAtIdx: index("permission_roles_deleted_at_idx").on(
            table.deletedAt,
        ),
    }),
);

// Role-based relations
export const rolesRelations = relations(roles, ({ one, many }) => ({
    // Many-to-one relationship to accounts
    account: one(accounts, {
        fields: [roles.accountId],
        references: [accounts.id],
    }),

    // One-to-many relationship with rolePermissions
    rolePermissions: many(permissionRoles),

    // One-to-many relationship with roleUsers
    roleUsers: many(roleUsers),
}));

export const roleUsersRelations = relations(roleUsers, ({ one }) => ({
    // User assigned the role
    user: one(users, {
        fields: [roleUsers.userId],
        references: [users.id],
    }),

    // Role assigned to the user
    role: one(roles, {
        fields: [roleUsers.roleId],
        references: [roles.id],
    }),

    // User who assigned the role (optional)
    assignedByUser: one(users, {
        fields: [roleUsers.assignedBy],
        references: [users.id],
    }),
}));

export const permissionsRelations = relations(permissions, ({ one, many }) => ({
    // One-to-many relationship with rolePermissions
    permissionRoles: many(permissionRoles),

    // Many-to-one relationship to accounts
    account: one(accounts, {
        fields: [permissions.accountId],
        references: [accounts.id],
    }),
}));

export const permissionRolesRelations = relations(
    permissionRoles,
    ({ one }) => ({
        // Many-to-one relationship to roles
        role: one(roles, {
            fields: [permissionRoles.roleId],
            references: [roles.id],
        }),

        // Many-to-one relationship to permissions
        permission: one(permissions, {
            fields: [permissionRoles.permissionId],
            references: [permissions.id],
        }),
    }),
);

// Stripe Tables
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

// Stripe-based relations
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

// Metrics
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

// Metrics-related relations
export const usageMetricsRelations = relations(usageMetrics, ({ one }) => ({
    user: one(users, {
        fields: [usageMetrics.userId],
        references: [users.id],
    }),
}));

// Webhook Events (for idempotency)
export const webhookEvents = pgTable(
    "webhook_events",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        eventId: text("event_id").notNull(), // Unique identifier from webhook provider
        source: text("source").notNull(), // e.g., "stripe", "app", "custom"
        eventType: text("event_type").notNull(), // e.g., "checkout.session.completed"
        processed: boolean("processed").notNull().default(false),
        processedAt: timestamp("processed_at", { withTimezone: true }),
        payload: jsonb("payload").notNull(), // Full webhook payload
        metadata: jsonb("metadata").default("{}"), // Additional metadata
        error: text("error"), // Error message if processing failed
        retryCount: integer("retry_count").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        eventIdIdx: uniqueIndex("webhook_events_event_id_idx").on(
            table.eventId,
            table.source,
        ), // Unique per source
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

// Webhook events relations
export const webhookEventsRelations = relations(webhookEvents, ({ one }) => ({
    // Add relations here if needed (e.g., to accounts, users, etc.)
}));

// Notifications table
export const notifications = pgTable(
    "notifications",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        userId: uuid("user_id").references(() => users.id, {
            onDelete: "cascade",
        }), // null = role-based notification
        roleIds: uuid("role_ids").array(), // Array of role IDs for role-based notifications
        type: notificationTypeEnum("type").notNull(),
        title: text("title").notNull(),
        message: text("message").notNull(),
        actionUrl: text("action_url"), // Optional URL for action button
        actionLabel: text("action_label"), // Optional label for action button
        metadata: jsonb("metadata").default("{}"), // Additional data
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
        // Composite index for user notifications query
        userReadIdx: index("notifications_user_read_idx").on(
            table.userId,
            table.read,
        ),
        // Composite index for account notifications query
        accountReadIdx: index("notifications_account_read_idx").on(
            table.accountId,
            table.read,
        ),
    }),
);

// Notifications relations
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

export const platformAdmins = pgTable(
    "platform_admins",
    {
        id: uuid("id").primaryKey(),
        email: text("email").notNull().unique(),
        displayName: text("display_name"),
        isActive: boolean("is_active").notNull().default(true),
        createdBy: uuid("created_by").references(
            (): AnyPgColumn => platformAdmins.id,
            { onDelete: "set null" },
        ),
        lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
        notes: text("notes"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        platformAdminsEmailIdx: index("platform_admins_email_idx").on(
            table.email,
        ),
        platformAdminsActiveIdx: index("platform_admins_active_idx").on(
            table.isActive,
        ),
    }),
);

export const platformAuditLogs = pgTable(
    "platform_audit_logs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        actorAdminId: uuid("actor_admin_id").references(() => platformAdmins.id, {
            onDelete: "set null",
        }),
        action: text("action").notNull(),
        targetType: text("target_type").notNull(),
        targetId: text("target_id"),
        accountId: uuid("account_id").references(() => accounts.id, {
            onDelete: "set null",
        }),
        changes: jsonb("changes").notNull().default({}),
        metadata: jsonb("metadata").notNull().default({}),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        platformAuditLogsActorIdx: index("platform_audit_logs_actor_idx").on(
            table.actorAdminId,
        ),
        platformAuditLogsAccountIdx: index(
            "platform_audit_logs_account_idx",
        ).on(table.accountId),
        platformAuditLogsActionIdx: index("platform_audit_logs_action_idx").on(
            table.action,
        ),
        platformAuditLogsCreatedAtIdx: index(
            "platform_audit_logs_created_at_idx",
        ).on(table.createdAt),
    }),
);

export const platformAdminsRelations = relations(platformAdmins, ({ one }) => ({
    creator: one(platformAdmins, {
        fields: [platformAdmins.createdBy],
        references: [platformAdmins.id],
    }),
}));

export const platformAuditLogsRelations = relations(
    platformAuditLogs,
    ({ one }) => ({
        actor: one(platformAdmins, {
            fields: [platformAuditLogs.actorAdminId],
            references: [platformAdmins.id],
        }),
        account: one(accounts, {
            fields: [platformAuditLogs.accountId],
            references: [accounts.id],
        }),
    }),
);

export const contactEnquiries = pgTable(
    "contact_enquiries",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        source: contactEnquirySourceEnum("source").notNull(),
        status: contactEnquiryStatusEnum("status").notNull().default("open"),
        category: contactEnquiryCategoryEnum("category")
            .notNull()
            .default("general"),
        name: text("name"),
        email: text("email"),
        message: text("message").notNull(),
        accountId: uuid("account_id").references(() => accounts.id, {
            onDelete: "set null",
        }),
        userId: uuid("user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        metadata: jsonb("metadata").notNull().default({}),
        ...timestamps,
    },
    (table) => ({
        contactEnquiriesCreatedAtIdx: index(
            "contact_enquiries_created_at_idx",
        ).on(table.createdAt),
        contactEnquiriesStatusIdx: index("contact_enquiries_status_idx").on(
            table.status,
        ),
        contactEnquiriesSourceIdx: index("contact_enquiries_source_idx").on(
            table.source,
        ),
        contactEnquiriesAccountIdx: index("contact_enquiries_account_idx").on(
            table.accountId,
        ),
        contactEnquiriesUserIdx: index("contact_enquiries_user_idx").on(
            table.userId,
        ),
    }),
);

export const contactEnquiriesRelations = relations(
    contactEnquiries,
    ({ one }) => ({
        account: one(accounts, {
            fields: [contactEnquiries.accountId],
            references: [accounts.id],
        }),
        user: one(users, {
            fields: [contactEnquiries.userId],
            references: [users.id],
        }),
    }),
);

// Audit Logs table
export const auditLogs = pgTable(
    "audit_logs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        actorUserId: uuid("actor_user_id").references(() => users.id, {
            onDelete: "set null",
        }), // null for system actions
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        action: text("action").notNull(), // e.g., "user.created", "account.updated", "role.deleted"
        targetType: text("target_type").notNull(), // e.g., "users", "accounts", "roles"
        targetId: uuid("target_id"), // ID of the target entity (nullable for account-level actions)
        changes: jsonb("changes").default("{}"), // JSON diff of changes (before/after)
        metadata: jsonb("metadata").default("{}"), // Additional context (IP address, user agent, etc.)
        ipAddress: text("ip_address"), // IP address of the actor
        userAgent: text("user_agent"), // User agent string
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
        // Composite index for common queries
        accountCreatedAtIdx: index("audit_logs_account_created_at_idx").on(
            table.accountId,
            table.createdAt,
        ),
    }),
);

// Audit logs relations
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

// * * * * * * * * *
// Before & After MVP Tables
// * * * * * * * * *

/**
 * OUT OF SCOPE / NON-GOALS:
 * - Project management features
 * - Task tracking
 * - Note-taking app features
 * - Documentation system
 * - Client portal
 * - Collaboration platform
 * - AI assistant
 * - Voice input
 * - Automation/workflows
 * - Reverse geocoding (store lat/lng; location string optional later)
 * - Advanced analytics/engagement tracking
 * - "Category blocks" (before/after/context) - blocks are now optional grouping
 *
 * This app is ONLY for capturing visual proof of work via jobs/blocks/media.
 */

// Clients table
// Clients are optional; jobs may exist without clients.
export const clients = pgTable(
    "clients",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        notes: text("notes"), // Optional notes/contact info
        ...timestamps,
    },
    (table) => ({
        accountIdIdx: index("clients_account_id_idx").on(table.accountId),
        deletedAtIdx: index("clients_deleted_at_idx").on(table.deletedAt),
    }),
);

export const tags = pgTable(
    "tags",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        color: text("color"),
        ...timestamps,
    },
    (table) => ({
        accountIdIdx: index("tags_account_id_idx").on(table.accountId),
        slugIdx: index("tags_slug_idx").on(table.slug),
        deletedAtIdx: index("tags_deleted_at_idx").on(table.deletedAt),
        accountSlugUnique: uniqueIndex("tags_account_slug_unique").on(
            table.accountId,
            table.slug,
        ),
    }),
);

// Jobs table
// Jobs belong to accounts and optionally to clients.
// Business Rules:
// - Jobs may be assigned to a client, but client is optional.
export const jobs = pgTable(
    "jobs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        // Break circular type inference: jobs -> media -> galleries -> job_elements -> jobs
        thumbnailMediaId: uuid("thumbnail_media_id").references(
            (): AnyPgColumn => media.id,
            {
                onDelete: "set null",
            },
        ),
        clientId: uuid("client_id").references(() => clients.id, {
            onDelete: "set null",
        }),
        title: text("title").notNull(),
        status: jobStatusEnum("status").notNull().default("active"),
        completedAt: timestamp("completed_at", { withTimezone: true }),
        firstCaptureAt: timestamp("first_capture_at", {
            withTimezone: true,
        }),
        lastCaptureAt: timestamp("last_capture_at", {
            withTimezone: true,
        }),
        captureCount: integer("capture_count").notNull().default(0),
        mediaCount: integer("media_count").notNull().default(0),
        presentationSettings: jsonb("presentation_settings")
            .default({})
            .notNull(),
        ...timestamps,
    },
    (table) => ({
        accountIdIdx: index("jobs_account_id_idx").on(table.accountId),
        clientIdIdx: index("jobs_client_id_idx").on(table.clientId),
        statusIdx: index("jobs_status_idx").on(table.status),
        deletedAtIdx: index("jobs_deleted_at_idx").on(table.deletedAt),
    }),
);

export const jobTags = pgTable(
    "job_tags",
    {
        jobId: uuid("job_id")
            .notNull()
            .references(() => jobs.id, { onDelete: "cascade" }),
        tagId: uuid("tag_id")
            .notNull()
            .references(() => tags.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.jobId, table.tagId] }),
        jobIdIdx: index("job_tags_job_id_idx").on(table.jobId),
        tagIdIdx: index("job_tags_tag_id_idx").on(table.tagId),
    }),
);

// Blocks table
// Blocks are optional grouping containers for images/media within a job
// No fixed categories (before/after/context) - blocks are now optional grouping
// Business Rule: Blocks act as a way to group images together and add context

// Job Elements table
// Defines the content structure within a job
// Each element has a type (rich_text, gallery) and an explicit order
export const jobElements = pgTable(
    "job_elements",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        jobId: uuid("job_id")
            .notNull()
            .references(() => jobs.id, { onDelete: "cascade" }),
        type: jobElementTypeEnum("type").notNull(),
        order: integer("order").notNull().default(0), // Explicit ordering
        content: text("content"), // Legacy text content retained temporarily for rollback/debug
        contentJson: jsonb("content_json"), // TipTap JSON for rich_text elements
        visibility: jobItemVisibilityEnum("visibility")
            .notNull()
            .default("visible"),
        ...timestamps,
    },
    (table) => ({
        jobIdIdx: index("job_elements_job_id_idx").on(table.jobId),
        jobIdOrderIdx: index("job_elements_job_id_order_idx").on(
            table.jobId,
            table.order,
        ),
        jobIdVisibilityIdx: index("job_elements_job_id_visibility_idx").on(
            table.jobId,
            table.visibility,
        ),
        deletedAtIdx: index("job_elements_deleted_at_idx").on(table.deletedAt),
    }),
);

// Galleries table
// Container for media items within a gallery-type job element
export const galleries = pgTable(
    "galleries",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        jobElementId: uuid("job_element_id")
            .notNull()
            .references(() => jobElements.id, { onDelete: "cascade" }),
        label: text("label"),
        showCaptions: boolean("show_captions").default(false).notNull(),
        orderingMode: galleryOrderingModeEnum("ordering_mode"),
        orderingDirection: galleryOrderingDirectionEnum("ordering_direction"),
        ...timestamps,
    },
    (table) => ({
        jobElementIdIdx: index("galleries_job_element_id_idx").on(
            table.jobElementId,
        ),
        deletedAtIdx: index("galleries_deleted_at_idx").on(table.deletedAt),
    }),
);

// Media table
// Individual media instances (from file picker or converted from captures)
// Belongs to a gallery
// NOTE: media.uploadOrder field will be used for ordering within galleries
export const media = pgTable(
    "media",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        capturedByUserId: uuid("captured_by_user_id").references(
            () => users.id,
            {
                onDelete: "set null",
            },
        ),
        galleryId: uuid("gallery_id")
            .notNull()
            .references(() => galleries.id, { onDelete: "cascade" }),
        storagePath: text("storage_path").notNull(), // Supabase Storage path
        storageUrl: text("storage_url").notNull(), // Public URL
        fileName: text("file_name").notNull(),
        fileSize: integer("file_size").notNull(), // bytes
        mimeType: text("mime_type").notNull(),
        lqipDataUrl: text("lqip_data_url"), // Tiny image data URL placeholder
        isCaptureOrigin: boolean("is_capture_origin")
            .notNull()
            .default(false),
        captureTimestamp: timestamp("capture_timestamp", {
            withTimezone: true,
        }), // When photo was taken (EXIF)
        caption: text("caption"), // Image-level caption
        uploadOrder: integer("upload_order").notNull().default(0), // Preserve upload order, used for ordering within gallery
        currentOrder: integer("current_order").notNull().default(0), // Current order within gallery
        uploadStatus: uploadStatusEnum("upload_status")
            .notNull()
            .default("pending"), // Track upload status
        variantStatus: variantStatusEnum("variant_status")
            .notNull()
            .default("pending"),
        uploadedAt: timestamp("uploaded_at", { withTimezone: true }), // When upload completed
        width: integer("width"), // Image width in pixels
        height: integer("height"), // Image height in pixels
        aspectRatio: numeric("aspect_ratio", {
            precision: 10,
            scale: 6,
        }), // width / height for display calculations
        visibility: jobItemVisibilityEnum("visibility")
            .notNull()
            .default("visible"),
        ...timestamps,
    },
    (table) => ({
        capturedByUserIdIdx: index("media_captured_by_user_id_idx").on(
            table.capturedByUserId,
        ),
        galleryIdIdx: index("media_gallery_id_idx").on(table.galleryId),
        galleryVisibilityIdx: index("media_gallery_id_visibility_idx").on(
            table.galleryId,
            table.visibility,
        ),
        variantStatusIdx: index("media_variant_status_idx")
            .on(table.variantStatus)
            .where(sql`${table.deletedAt} IS NULL`),
        // Index for ordering media within a gallery
        galleryOrderIdx: index("media_gallery_order_idx").on(
            table.galleryId,
            table.currentOrder,
        ),
        deletedAtIdx: index("media_deleted_at_idx").on(table.deletedAt),
    }),
);

// Captures table
// Unassigned captures (can exist without job_id or block_id)
// Business Rule: Captures can exist without job_id (Inbox)
// When assigned to a job, captures can be moved to media table or kept as captures
export const captures = pgTable(
    "captures",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        capturedByUserId: uuid("captured_by_user_id").references(
            () => users.id,
            {
                onDelete: "set null",
            },
        ),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        storagePath: text("storage_path").notNull(), // Supabase Storage path
        storageUrl: text("storage_url").notNull(), // Public URL
        fileName: text("file_name").notNull(),
        fileSize: integer("file_size").notNull(), // bytes
        mimeType: text("mime_type").notNull(),
        lqipDataUrl: text("lqip_data_url"), // Tiny image data URL placeholder
        caption: text("caption"), // Image-level caption
        latitude: numeric("latitude", { precision: 10, scale: 7 }), // Location data
        longitude: numeric("longitude", { precision: 10, scale: 7 }),
        locationAccuracy: numeric("location_accuracy", {
            precision: 10,
            scale: 2,
        }), // Accuracy in meters
        capturedAt: timestamp("captured_at", {
            withTimezone: true,
        }), // When photo was taken
        width: integer("width"), // Image width in pixels
        height: integer("height"), // Image height in pixels
        aspectRatio: numeric("aspect_ratio", {
            precision: 10,
            scale: 6,
        }), // width / height for display calculations
        idempotencyKey: text("idempotency_key"), // For duplicate prevention in offline queue
        queuedAt: timestamp("queued_at", {
            withTimezone: true,
        }), // When capture was added to offline queue (client timestamp)
        syncedAt: timestamp("synced_at", {
            withTimezone: true,
        }), // When capture was successfully synced to server
        syncRetryCount: integer("sync_retry_count").default(0).notNull(), // Number of retry attempts before successful sync
        syncMetadata: jsonb("sync_metadata").default({}).notNull(), // Additional sync info (queueItemId, lastError, syncDuration, clientInfo)
        assignmentMetadata: jsonb("assignment_metadata").default({}).notNull(), // Additional assignment info (jobId, galleryId, mediaId, assignedAt)
        upgradeToMedia: jsonb("upgrade_to_media"),
        variantStatus: variantStatusEnum("variant_status")
            .notNull()
            .default("pending"),
        ...timestamps,
    },
    (table) => ({
        capturedByUserIdIdx: index("captures_captured_by_user_id_idx").on(
            table.capturedByUserId,
        ),
        accountIdIdx: index("captures_account_id_idx").on(table.accountId),

        createdAtIdx: index("captures_created_at_idx").on(table.createdAt), // For chronological sorting
        pageCapturedAllIdx: index("captures_page_captured_all_idx")
            .on(
                table.accountId,
                sql`COALESCE(${table.capturedAt}, ${table.updatedAt}, ${table.createdAt})`,
                table.id,
            )
            .where(sql`${table.deletedAt} IS NULL`),
        pageUpdatedAllIdx: index("captures_page_updated_all_idx")
            .on(table.accountId, table.updatedAt, table.id)
            .where(sql`${table.deletedAt} IS NULL`),
        pageCapturedAssignedIdx: index("captures_page_captured_assigned_idx")
            .on(
                table.accountId,
                sql`COALESCE(${table.capturedAt}, ${table.updatedAt}, ${table.createdAt})`,
                table.id,
            )
            .where(sql`${table.deletedAt} IS NULL AND ((jsonb_typeof(${table.assignmentMetadata}) = 'object' AND NULLIF(${table.assignmentMetadata} ->> 'assignedAt', '') IS NOT NULL) OR (jsonb_typeof(${table.assignmentMetadata}) = 'string' AND (${table.assignmentMetadata} #>> '{}') ~ '"assignedAt"[[:space:]]*:[[:space:]]*"[^"]+"'))`),
        pageUpdatedAssignedIdx: index("captures_page_updated_assigned_idx")
            .on(table.accountId, table.updatedAt, table.id)
            .where(sql`${table.deletedAt} IS NULL AND ((jsonb_typeof(${table.assignmentMetadata}) = 'object' AND NULLIF(${table.assignmentMetadata} ->> 'assignedAt', '') IS NOT NULL) OR (jsonb_typeof(${table.assignmentMetadata}) = 'string' AND (${table.assignmentMetadata} #>> '{}') ~ '"assignedAt"[[:space:]]*:[[:space:]]*"[^"]+"'))`),
        deletedAtIdx: index("captures_deleted_at_idx").on(table.deletedAt),
        idempotencyKeyIdx: uniqueIndex("captures_idempotency_key_idx").on(
            table.idempotencyKey,
        ), // Unique index for idempotency lookups (prevents duplicates)
        variantStatusIdx: index("captures_variant_status_idx")
            .on(table.variantStatus)
            .where(sql`${table.deletedAt} IS NULL`),
    }),
);

export const voiceLogs = pgTable(
    "voice_logs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        capturedByUserId: uuid("captured_by_user_id").references(
            () => users.id,
            { onDelete: "set null" },
        ),
        jobId: uuid("job_id").references(() => jobs.id, {
            onDelete: "set null",
        }),
        pipelineAlias: text("pipeline_alias").notNull(),
        pipelineLabel: text("pipeline_label"),
        veritieJobId: text("veritie_job_id"),
        veritieStreamSessionId: text("veritie_stream_session_id"),
        status: voiceLogStatusEnum("status").notNull().default("preparing"),
        transcriptText: text("transcript_text"),
        previousTranscriptText: text("previous_transcript_text"),
        transcriptEditedAt: timestamp("transcript_edited_at", {
            withTimezone: true,
        }),
        transcriptEditedByUserId: uuid(
            "transcript_edited_by_user_id",
        ).references(() => users.id, { onDelete: "set null" }),
        transcriptArtifact: jsonb("transcript_artifact"),
        extractionPayload: jsonb("extraction_payload"),
        evidenceIndex: jsonb("evidence_index"),
        toolSuggestions: jsonb("tool_suggestions"),
        veritieDetail: jsonb("veritie_detail"),
        errorMessage: text("error_message"),
        audioMimeType: text("audio_mime_type"),
        audioSizeBytes: integer("audio_size_bytes"),
        durationMs: integer("duration_ms"),
        capturedAt: timestamp("captured_at", { withTimezone: true }),
        transcriptReadyAt: timestamp("transcript_ready_at", {
            withTimezone: true,
        }),
        completedAt: timestamp("completed_at", { withTimezone: true }),
        lastRefreshedAt: timestamp("last_refreshed_at", {
            withTimezone: true,
        }),
        refreshRetryCount: integer("refresh_retry_count")
            .notNull()
            .default(0),
        idempotencyKey: text("idempotency_key"),
        queuedAt: timestamp("queued_at", { withTimezone: true }),
        syncedAt: timestamp("synced_at", { withTimezone: true }),
        syncRetryCount: integer("sync_retry_count").notNull().default(0),
        syncMetadata: jsonb("sync_metadata"),
        metadata: jsonb("metadata").default({}).notNull(),
        ...timestamps,
    },
    (table) => ({
        idempotencyKeyIdx: uniqueIndex("voice_logs_idempotency_key_idx").on(
            table.idempotencyKey,
        ),
        accountIdIdx: index("voice_logs_account_id_idx").on(table.accountId),
        accountCreatedAtIdx: index("voice_logs_account_created_at_idx").on(
            table.accountId,
            table.createdAt,
            table.id,
        ),
        accountJobCreatedAtIdx: index(
            "voice_logs_account_job_created_at_idx",
        ).on(table.accountId, table.jobId, table.createdAt),
        accountStatusIdx: index("voice_logs_account_status_idx").on(
            table.accountId,
            table.status,
        ),
        veritieJobIdUniqueIdx: uniqueIndex(
            "voice_logs_veritie_job_id_unique_idx",
        )
            .on(table.veritieJobId)
            .where(sql`${table.veritieJobId} IS NOT NULL`),
        deletedAtIdx: index("voice_logs_deleted_at_idx").on(table.deletedAt),
    }),
);

export const mediaProcessingJobs = pgTable(
    "media_processing_jobs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        sourceType: mediaProcessingSourceTypeEnum("source_type").notNull(),
        sourceId: uuid("source_id").notNull(),
        storagePath: text("storage_path").notNull(),
        storageProvider: text("storage_provider")
            .notNull()
            .default("supabase"),
        mimeType: text("mime_type").notNull(),
        sourceWidth: integer("source_width"),
        targetWidths: jsonb("target_widths")
            .$type<number[]>()
            .notNull()
            .default([320, 768, 1280]),
        completedWidths: jsonb("completed_widths")
            .$type<number[]>()
            .notNull()
            .default([]),
        status: mediaProcessingJobStatusEnum("status")
            .notNull()
            .default("pending"),
        attemptCount: integer("attempt_count").notNull().default(0),
        maxAttempts: integer("max_attempts").notNull().default(5),
        nextRunAt: timestamp("next_run_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        lastError: text("last_error"),
        startedAt: timestamp("started_at", { withTimezone: true }),
        completedAt: timestamp("completed_at", { withTimezone: true }),
        ...timestamps,
    },
    (table) => ({
        sourceUniqueIdx: uniqueIndex("media_processing_jobs_source_unique_idx")
            .on(table.sourceType, table.sourceId),
        pollIdx: index("media_processing_jobs_poll_idx")
            .on(table.status, table.nextRunAt, table.createdAt)
            .where(sql`${table.deletedAt} IS NULL`),
        accountIdx: index("media_processing_jobs_account_idx").on(
            table.accountId,
        ),
    }),
);

// Share links table
// Public share links for jobs (read-only, no auth required)
// TODO: Consider adding gallery layout metadata to improve share link loading experience:
// - Store aspect ratios for each media item to prevent layout shift
// - Cache block/media structure to reduce query complexity
// - Consider adding a `galleryMetadata` JSONB field with pre-calculated dimensions
export const shareLinks = pgTable(
    "share_links",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        jobId: uuid("job_id")
            .notNull()
            .references(() => jobs.id, { onDelete: "cascade" }),
        token: text("token").notNull().unique(), // Public token for URL
        expiresAt: timestamp("expires_at", { withTimezone: true }), // Optional expiration
        coverObjectPath: text("cover_object_path"), // Path to cover image in public bucket
        coverUpdatedAt: timestamp("cover_updated_at", {
            withTimezone: true,
        }), // When cover was last updated
        coverMediaId: uuid("cover_media_id"), // Media ID used for cover (for tracking)
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        jobIdIdx: index("share_links_job_id_idx").on(table.jobId),
    }),
);

// Before & After relations
export const clientsRelations = relations(clients, ({ one, many }) => ({
    account: one(accounts, {
        fields: [clients.accountId],
        references: [accounts.id],
    }),
    jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
    account: one(accounts, {
        fields: [jobs.accountId],
        references: [accounts.id],
    }),
    client: one(clients, {
        fields: [jobs.clientId],
        references: [clients.id],
    }),
    // captures: many(captures),
    voiceLogs: many(voiceLogs),
    shareLinks: many(shareLinks),
    jobElements: many(jobElements),
    jobTags: many(jobTags),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
    account: one(accounts, {
        fields: [tags.accountId],
        references: [accounts.id],
    }),
    jobTags: many(jobTags),
}));

export const jobTagsRelations = relations(jobTags, ({ one }) => ({
    job: one(jobs, {
        fields: [jobTags.jobId],
        references: [jobs.id],
    }),
    tag: one(tags, {
        fields: [jobTags.tagId],
        references: [tags.id],
    }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
    capturedByUser: one(users, {
        fields: [media.capturedByUserId],
        references: [users.id],
    }),
    gallery: one(galleries, {
        fields: [media.galleryId],
        references: [galleries.id],
    }),
}));

export const capturesRelations = relations(captures, ({ one }) => ({
    account: one(accounts, {
        fields: [captures.accountId],
        references: [accounts.id],
    }),
    capturedByUser: one(users, {
        fields: [captures.capturedByUserId],
        references: [users.id],
    }),
}));

export const voiceLogsRelations = relations(voiceLogs, ({ one }) => ({
    account: one(accounts, {
        fields: [voiceLogs.accountId],
        references: [accounts.id],
    }),
    capturedByUser: one(users, {
        fields: [voiceLogs.capturedByUserId],
        references: [users.id],
    }),
    job: one(jobs, {
        fields: [voiceLogs.jobId],
        references: [jobs.id],
    }),
}));

export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
    job: one(jobs, {
        fields: [shareLinks.jobId],
        references: [jobs.id],
    }),
}));

export const jobElementsRelations = relations(jobElements, ({ one, many }) => ({
    job: one(jobs, {
        fields: [jobElements.jobId],
        references: [jobs.id],
    }),
    galleries: many(galleries),
}));

export const galleriesRelations = relations(galleries, ({ one, many }) => ({
    jobElement: one(jobElements, {
        fields: [galleries.jobElementId],
        references: [jobElements.id],
    }),
    media: many(media),
}));
