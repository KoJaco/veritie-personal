import {
    getRouteConfig,
    ROUTE_CONFIGS,
} from "@/components/context/route-config-registry";

describe("route-config-registry", () => {
    it("returns configured scope and resource route contracts", () => {
        expect(getRouteConfig("scopes_index")).toMatchObject({
            enabled: true,
            showTrigger: true,
            defaultTab: "assistant",
        });
        expect(getRouteConfig("scopes_operations_readiness")).toMatchObject({
            enabled: true,
            showTrigger: true,
            defaultTab: "assistant",
        });
        expect(getRouteConfig("scopes_delivery_observability")).toMatchObject({
            enabled: true,
            showTrigger: true,
        });
        expect(getRouteConfig("scopes_workspace_resilience")).toMatchObject({
            enabled: true,
            showTrigger: true,
        });
        expect(getRouteConfig("scopes_knowledge_hygiene")).toMatchObject({
            enabled: true,
            showTrigger: true,
        });
        expect(getRouteConfig("scope_checks_index")).toMatchObject({
            enabled: true,
            showTrigger: true,
        });
        expect(getRouteConfig("scope_check_detail")).toMatchObject({
            enabled: true,
            showTrigger: true,
        });
        expect(getRouteConfig("resources_index")).toMatchObject({
            enabled: true,
            showTrigger: true,
        });
        expect(getRouteConfig("resources_detail")).toMatchObject({
            enabled: true,
            showTrigger: true,
        });
    });

    it("keeps assistant/context tabs for enabled routes and disabled unknown/settings behavior", () => {
        const enabledRoutes = Object.values(ROUTE_CONFIGS).filter(
            (config) => config.enabled,
        );

        for (const route of enabledRoutes) {
            expect(route.tabs.map((t) => t.key)).toEqual([
                "assistant",
                "context",
            ]);
        }

        expect(getRouteConfig("settings")).toMatchObject({
            enabled: false,
            showTrigger: false,
            tabs: [{ key: "assistant", label: "Assistant" }],
        });

        expect(getRouteConfig("unknown")).toMatchObject({
            enabled: false,
            showTrigger: false,
            tabs: [],
        });
    });
});
