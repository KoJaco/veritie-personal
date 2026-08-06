import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { NextResponse, type NextRequest } from "next/server";

const mockUpdateSession = jest.fn<
    () => Promise<{ response: NextResponse; user: { id: string } | null }>
>();

jest.mock("@/lib/supabase/middleware", () => ({
    updateSession: () => mockUpdateSession(),
}));

function createProxyRequest(pathname: string): NextRequest {
    return {
        nextUrl: new URL(`http://localhost${pathname}`),
    } as NextRequest;
}

describe("proxy", () => {
    beforeEach(() => {
        jest.resetModules();
        mockUpdateSession.mockReset();
        mockUpdateSession.mockResolvedValue({
            response: NextResponse.next(),
            user: { id: "user_1" },
        });
    });

    it("returns JSON 401 for unauthenticated API requests", async () => {
        mockUpdateSession.mockResolvedValue({
            response: NextResponse.next(),
            user: null,
        });

        const { proxy } = await import("@/proxy");
        const response = await proxy(createProxyRequest("/api/chat"));

        expect(response.status).toBe(401);
        expect(response.headers.get("location")).toBeNull();
        expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("redirects unauthenticated app routes to login", async () => {
        mockUpdateSession.mockResolvedValue({
            response: NextResponse.next(),
            user: null,
        });

        const { proxy } = await import("@/proxy");
        const response = await proxy(createProxyRequest("/captures"));

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toMatch(
            /\/auth\/login\?next=%2Fcaptures/,
        );
    });

    it("allows authenticated API requests through", async () => {
        const { proxy } = await import("@/proxy");
        const response = await proxy(createProxyRequest("/api/chat"));

        expect(response.status).toBe(200);
    });
});
