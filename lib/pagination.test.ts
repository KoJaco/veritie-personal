import {
    buildPaginationState,
    clampPage,
    paginateItems,
    parsePageParam,
} from "@/lib/pagination";

describe("pagination helpers", () => {
    it("parses invalid page params to the default page", () => {
        expect(parsePageParam(undefined)).toBe(1);
        expect(parsePageParam("0")).toBe(1);
        expect(parsePageParam("abc")).toBe(1);
        expect(parsePageParam(["3"])).toBe(3);
    });

    it("clamps pages to the valid range", () => {
        expect(clampPage(0, 4)).toBe(1);
        expect(clampPage(2, 4)).toBe(2);
        expect(clampPage(9, 4)).toBe(4);
    });

    it("builds empty pagination state safely", () => {
        expect(buildPaginationState(0, 3, 20)).toEqual({
            currentPage: 1,
            pageSize: 20,
            totalItems: 0,
            totalPages: 1,
            rangeStart: 0,
            rangeEnd: 0,
        });
    });

    it("paginates item arrays with clamped page bounds", () => {
        const items = Array.from({ length: 44 }, (_, index) => index + 1);
        const { pagination, pageItems } = paginateItems(items, 5, 20);

        expect(pagination.currentPage).toBe(3);
        expect(pagination.totalPages).toBe(3);
        expect(pagination.rangeStart).toBe(41);
        expect(pagination.rangeEnd).toBe(44);
        expect(pageItems).toEqual([41, 42, 43, 44]);
    });
});
