import {
    ALL_ACTIONS,
    buildPermissionCatalog,
    ENTITY_TYPES,
    isOwnerGrantedEntity,
    OWNER_GRANTED_ENTITIES,
} from "@/lib/auth/permission-seed";

describe("permission-seed", () => {
    it("builds a catalog entry for every entity type", () => {
        const catalog = buildPermissionCatalog();

        expect(catalog.length).toBe(ENTITY_TYPES.length);
        expect(new Set(catalog.map((row) => row.entity)).size).toBe(
            ENTITY_TYPES.length,
        );
    });

    it("assigns full CRUD actions to each catalog row", () => {
        const catalog = buildPermissionCatalog();

        for (const row of catalog) {
            expect(row.actions).toEqual(ALL_ACTIONS);
        }
    });

    it("limits owner grants to account, captures, and timeline_events", () => {
        const granted = ENTITY_TYPES.filter(isOwnerGrantedEntity);

        expect(granted).toEqual(OWNER_GRANTED_ENTITIES);
        expect(granted).not.toContain("users");
        expect(granted).not.toContain("billing");
    });
});
