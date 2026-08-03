import { LAYER_CLASS, LAYER_Z_INDEX } from "@/lib/ui/layering";

describe("layering", () => {
    it("uses literal Tailwind z-index classes for overlay layers", () => {
        expect(LAYER_CLASS.launcherBackdrop).toBe("z-[80]");
        expect(LAYER_CLASS.launcherChrome).toBe("z-[85]");
        expect(LAYER_CLASS.detailBackdrop).toBe("z-[90]");
        expect(LAYER_CLASS.detailPanel).toBe("z-[100]");
    });

    it("keeps numeric tokens aligned with class literals", () => {
        expect(LAYER_Z_INDEX.launcherBackdrop).toBe(80);
        expect(LAYER_Z_INDEX.launcherChrome).toBe(85);
        expect(LAYER_Z_INDEX.detailBackdrop).toBe(90);
        expect(LAYER_Z_INDEX.detailPanel).toBe(100);
    });
});
