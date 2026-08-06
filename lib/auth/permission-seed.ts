import type { ActionType, EntityType } from "./types";

/** All entity values from db/schema/identity entity enum */
export const ENTITY_TYPES: EntityType[] = [
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
];

export const ALL_ACTIONS: ActionType[] = [
    "create",
    "retrieve",
    "update",
    "delete",
];

/** Owner role receives these grants in Phase 1 (app-layer enforcement). */
export const OWNER_GRANTED_ENTITIES: EntityType[] = [
    "account",
    "captures",
    "timeline_events",
];

export const OWNER_ROLE_NAME = "Owner";

/** Lower number = higher privilege in role hierarchy */
export const OWNER_ROLE_ACCESS_LEVEL = 0;

export interface PermissionSeedRow {
    entity: EntityType;
    actions: ActionType[];
    description: string;
    isCritical?: boolean;
    isOwnerOnly?: boolean;
}

export function buildPermissionCatalog(): PermissionSeedRow[] {
    return ENTITY_TYPES.map((entity) => ({
        entity,
        actions: [...ALL_ACTIONS],
        description: `Default ${entity} permissions`,
        isCritical: entity === "account" || entity === "billing",
        isOwnerOnly:
            entity === "billing" ||
            entity === "subscriptions" ||
            entity === "permissions",
    }));
}

export function isOwnerGrantedEntity(entity: EntityType): boolean {
    return OWNER_GRANTED_ENTITIES.includes(entity);
}
