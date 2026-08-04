export type UserRole = "owner" | "admin" | "user";

export type EntityType =
    | "account"
    | "users"
    | "roles"
    | "permissions"
    | "subscriptions"
    | "billing"
    | "usage_metrics"
    | "audit_logs"
    | "jobs"
    | "captures"
    | "clients"
    | "tags"
    | "share_links"
    | "tasks"
    | "records"
    | "resources"
    | "goals"
    | "reminders"
    | "money_entries"
    | "timeline_events";

export type ActionType = "create" | "retrieve" | "update" | "delete";

export interface AppUser {
    id: string;
    email: string;
    accountId: string;
    role: UserRole;
    plan: string;
    appConfig: import("@/lib/domain/app-config").AppConfig;
}

export interface InitAccountWithUserInput {
    authUserId: string;
    email: string;
    provider: string;
    providerId: string;
    emailVerified: boolean;
    accountName: string;
    onboardingProfile?: import("@/lib/domain/app-config").OnboardingProfile | null;
}

export interface InitAccountWithUserResult {
    accountId: string;
    userId: string;
    roleId: string;
}
