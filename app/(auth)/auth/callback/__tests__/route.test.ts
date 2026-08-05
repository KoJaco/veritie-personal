import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextRequest } from "next/server";

const mockExchangeCodeForSession = jest.fn<
    () => Promise<{ data: { session: unknown }; error: null } | { data: { session: null }; error: { message: string } }>
>();
const mockGetUser = jest.fn<
    () => Promise<{
        data: { user: unknown };
        error: null | { message: string };
    }>
>();
const mockSignOut = jest.fn<() => Promise<{ error: null }>>();

const mockFindAppUserByAuthId = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockInitAccountWithUser = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockGetOnboardingProfileForInit = jest.fn<
    (...args: unknown[]) => Promise<unknown>
>();

if (!("Request" in globalThis)) {
    class MockRequest {
        url: string;
        constructor(url: string) {
            this.url = url;
        }
    }
    (globalThis as { Request?: unknown }).Request = MockRequest;
}

if (!("Response" in globalThis)) {
    class MockResponse {
        status: number;
        headers: Headers;

        constructor(body?: BodyInit | null, init?: ResponseInit) {
            this.status = init?.status ?? 200;
            this.headers = new Headers(init?.headers);
        }
    }

    (globalThis as { Response?: unknown }).Response = MockResponse;
}

jest.mock("next/server", () => ({
    NextResponse: {
        redirect: (url: URL | string, init?: { status?: number }) => {
            const location = typeof url === "string" ? url : url.toString();
            return new Response(null, {
                status: init?.status ?? 307,
                headers: { location },
            });
        },
    },
}));

jest.mock("@/lib/supabase/server", () => ({
    createClient: jest.fn(async () => ({
        auth: {
            exchangeCodeForSession: mockExchangeCodeForSession,
            getUser: mockGetUser,
            signOut: mockSignOut,
        },
    })),
}));

jest.mock("@/lib/auth/init-account", () => ({
    deriveAccountNameFromEmail: (email: string) => email.split("@")[0],
    findAppUserByAuthId: (...args: unknown[]) => mockFindAppUserByAuthId(...args),
    initAccountWithUser: (...args: unknown[]) => mockInitAccountWithUser(...args),
    isAccountDeleted: (account: { deletedAt: Date | null }) =>
        account.deletedAt !== null,
    isUserDeleted: (user: { deletedAt: Date | null }) =>
        user.deletedAt !== null,
}));

jest.mock("@/lib/auth/onboarding-profile", () => ({
    getOnboardingProfileForInit: (...args: unknown[]) =>
        mockGetOnboardingProfileForInit(...args),
}));

type CallbackRoute = typeof import("../route");

let GET: CallbackRoute["GET"];

beforeAll(async () => {
    const route = await import("../route");
    GET = route.GET;
});

function buildRequest(url: string): NextRequest {
    return new Request(url) as NextRequest;
}

describe("auth callback route", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSignOut.mockResolvedValue({ error: null });
    });

    it("redirects to error when code is missing", async () => {
        const response = await GET(
            buildRequest("http://localhost:3000/auth/callback"),
        );

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/auth/error");
    });

    it("initializes account for new users", async () => {
        mockExchangeCodeForSession.mockResolvedValue({
            data: { session: { access_token: "token" } },
            error: null,
        });
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    id: "user-1",
                    email: "new@example.com",
                    app_metadata: { provider: "google", provider_id: "g-1" },
                },
            },
            error: null,
        });
        mockFindAppUserByAuthId.mockResolvedValue(null);
        mockGetOnboardingProfileForInit.mockResolvedValue({
            enabledAspects: ["personal"],
            capturePreference: "voice_first",
            aiMode: "guided",
        });
        mockInitAccountWithUser.mockResolvedValue({
            accountId: "acc-1",
            userId: "user-1",
            roleId: "role-1",
        });

        const response = await GET(
            buildRequest(
                "http://localhost:3000/auth/callback?code=abc&next=/timeline",
            ),
        );

        expect(mockInitAccountWithUser).toHaveBeenCalledWith(
            expect.objectContaining({
                authUserId: "user-1",
                email: "new@example.com",
                provider: "google",
                providerId: "g-1",
            }),
        );
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(
            "http://localhost:3000/timeline",
        );
    });

    it("signs out and redirects when user is soft-deleted", async () => {
        mockExchangeCodeForSession.mockResolvedValue({
            data: { session: { access_token: "token" } },
            error: null,
        });
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    id: "user-1",
                    email: "deleted@example.com",
                    app_metadata: {},
                },
            },
            error: null,
        });
        mockFindAppUserByAuthId.mockResolvedValue({
            id: "user-1",
            deletedAt: new Date(),
            account: { deletedAt: null },
        });

        const response = await GET(
            buildRequest("http://localhost:3000/auth/callback?code=abc"),
        );

        expect(mockSignOut).toHaveBeenCalled();
        expect(response.headers.get("location")).toContain("error=account_deleted");
    });
});
