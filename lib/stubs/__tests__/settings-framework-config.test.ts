import {
    getScopeMappingStatusStub,
    getScopeMappingConfigStub,
    getSoc2FrameworkConfigStub,
    getSoc2CriteriaSetStatusStub,
} from "@/lib/stubs/settings";

describe("settings scope mapping config stubs", () => {
    it("returns deterministic scope mapping config with remediation links", () => {
        const config = getScopeMappingConfigStub();

        expect(config.mappingStatus).toBe("invalid");
        expect(config.topValidationErrors).toHaveLength(3);
        expect(config.topValidationErrors[0]).toMatchObject({
            id: "scope_mapping_owner_missing",
            remediation: {
                label: "Review blocked readiness tasks",
            },
        });
        expect(config.topValidationErrors[1]?.remediation.href).toContain(
            "/work/documents",
        );
        expect(config.topValidationErrors[2]?.remediation.href).toContain(
            "/work/scopes/admin",
        );
    });

    it("returns defensive copies so callers cannot mutate shared stub state", () => {
        const first = getScopeMappingConfigStub();
        first.topValidationErrors[0]!.title = "changed";

        const second = getScopeMappingConfigStub();
        expect(second.topValidationErrors[0]!.title).not.toBe("changed");
    });

    it("exposes mapping status via dedicated helpers", () => {
        expect(getScopeMappingStatusStub()).toBe("invalid");
        expect(getSoc2CriteriaSetStatusStub()).toBe("invalid");
        expect(getSoc2FrameworkConfigStub().mappingStatus).toBe("invalid");
    });
});
