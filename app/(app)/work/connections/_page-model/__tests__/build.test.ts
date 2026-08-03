import { buildConnectionsRouteContract } from "../build";
import { enforceConnectionsRouteContract } from "../validate";
import { stubDataSourceAdapters } from "@/lib/data-source/stub-adapter";

describe("buildConnectionsRouteContract", () => {
    it("builds a valid connections index contract without undefined hrefs", () => {
        const connectionsIndex =
            stubDataSourceAdapters.connections.getConnectionsIndex();
        const visibleConnections = [
            ...connectionsIndex.connected,
            ...connectionsIndex.disconnected,
        ];

        const contract = buildConnectionsRouteContract({
            scope: "connections_index",
            lens: { scope: "all" },
            visibleConnections,
        });
        const enforced = enforceConnectionsRouteContract(contract);

        expect(enforced.pageModelValidation.ok).toBe(true);
        expect(enforced.payload?.scope.type).toBe("connections_index");
        expect(
            contract.pageModel.refs?.visible?.every(
                (item) => !("href" in item) || typeof item.href === "string",
            ),
        ).toBe(true);
    });

    it("builds a valid connection detail contract with a distinct scope id", () => {
        const detail =
            stubDataSourceAdapters.connections.getConnectionDetail(
                "conn_azure_ad",
            );

        const contract = buildConnectionsRouteContract({
            scope: "connections_detail",
            lens: { scope: "operations-readiness" },
            connectionDetail: detail,
        });
        const enforced = enforceConnectionsRouteContract(contract);

        expect(enforced.pageModelValidation.ok).toBe(true);
        expect(enforced.payload?.scope).toEqual({
            type: "connections_detail",
            id: detail.id,
        });
    });
});
