import {
    enforceConnectionsRouteContract,
    validateConnectionsRouteContractShape,
} from "../validate";
import { buildConnectionsRouteContract } from "../build";
import { stubDataSourceAdapters } from "@/lib/data-source/stub-adapter";

describe("validateConnectionsRouteContractShape", () => {
    it("rejects invalid connections route contract shapes", () => {
        const result = validateConnectionsRouteContractShape({
            pageModel: {},
            railPayloadCandidate: {},
        });

        expect(result.ok).toBe(false);
    });

    it("fails closed when the page model becomes invalid", () => {
        const connectionsIndex =
            stubDataSourceAdapters.connections.getConnectionsIndex();
        const contract = buildConnectionsRouteContract({
            scope: "connections_index",
            lens: { scope: "all" },
            visibleConnections: [
                ...connectionsIndex.connected,
                ...connectionsIndex.disconnected,
            ],
        });

        const enforced = enforceConnectionsRouteContract({
            ...contract,
            pageModel: {
                ...contract.pageModel,
                sections: [
                    {
                        key: "invalid",
                        kind: "connections_catalog",
                        items: [
                            {
                                kind: "connection",
                                id: "conn_1",
                                rawMarkdown: "# invalid",
                            },
                        ],
                    },
                ],
            } as never,
        });

        expect(enforced.pageModelValidation.ok).toBe(false);
        expect(enforced.payload).toBeNull();
    });
});
