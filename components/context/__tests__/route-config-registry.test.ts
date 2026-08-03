import {
    getRouteConfig,
    ROUTE_CONFIGS,
} from "@/components/context/route-config-registry";

describe("route-config-registry", () => {
    it("returns configured personal app route contracts", () => {
        expect(getRouteConfig("timeline")).toMatchObject({
            enabled: true,
            showTrigger: false,
            defaultTab: "assistant",
        });
        expect(getRouteConfig("captures_index")).toMatchObject({
            enabled: true,
            showTrigger: false,
        });
        expect(getRouteConfig("capture_detail")).toMatchObject({
            enabled: true,
            showTrigger: false,
        });
        expect(getRouteConfig("task_index")).toMatchObject({
            enabled: true,
            showTrigger: false,
        });
        expect(getRouteConfig("task_detail")).toMatchObject({
            enabled: true,
            showTrigger: false,
        });
        expect(getRouteConfig("records_index")).toMatchObject({
            enabled: true,
            showTrigger: false,
        });
        expect(getRouteConfig("records_detail")).toMatchObject({
            enabled: true,
            showTrigger: false,
        });
        expect(getRouteConfig("resources_index")).toMatchObject({
            enabled: true,
            showTrigger: false,
        });
        expect(getRouteConfig("resources_detail")).toMatchObject({
            enabled: true,
            showTrigger: false,
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
