import { buildResourcesRouteContract } from "../build";
import { enforceResourcesRouteContract } from "../validate";
import { stubDataSourceAdapters } from "@/lib/data-source/stub-adapter";

describe("buildResourcesRouteContract", () => {
    it("builds the resources index contract from the visible slice", async () => {
        const resourcesIndex =
            await stubDataSourceAdapters.resources.getResourcesIndex();
        const visibleResources = resourcesIndex.items.slice(0, 3);

        const contract = buildResourcesRouteContract({
            scope: "resources_index",
            lens: { scope: "all" },
            resourcesSummary: resourcesIndex.summary,
            visibleResources,
        });
        const enforced = enforceResourcesRouteContract(contract);

        expect(enforced.pageModelValidation.ok).toBe(true);
        expect(contract.pageModel.refs?.visible).toHaveLength(3);
        expect(
            contract.pageModel.sections.find(
                (section) => section.key === "resources_inventory",
            )?.items,
        ).toHaveLength(3);
    });
});
