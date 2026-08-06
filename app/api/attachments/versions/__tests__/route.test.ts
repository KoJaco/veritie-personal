import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { resetStubAttachmentStoreForTests } from "@/lib/data-source";
import { createTestJsonRequest } from "@/lib/api/test-json-request";

const mockRequireUser = jest.fn<() => Promise<{ id: string; accountId: string }>>();

if (!("Request" in globalThis)) {
    class MockRequest {}
    (globalThis as { Request?: unknown }).Request = MockRequest;
}

if (!("Response" in globalThis)) {
    class MockResponse {
        status: number;
        private payload: unknown;

        constructor(body?: string, init?: { status?: number }) {
            this.status = init?.status ?? 200;
            this.payload = body ? JSON.parse(body) : undefined;
        }

        async json() {
            return this.payload;
        }
    }

    (globalThis as { Response?: unknown }).Response = MockResponse;
}

jest.mock("next/server", () => ({
    NextResponse: {
        json: (body: unknown, init?: { status?: number }) =>
            new Response(JSON.stringify(body), {
                status: init?.status ?? 200,
                headers: { "content-type": "application/json" },
            }),
    },
}));

jest.mock("@/lib/auth/require-user", () => ({
    requireUser: () => mockRequireUser(),
}));

function createJsonRequest(body: unknown) {
    return createTestJsonRequest(body);
}

describe("POST /api/attachments/versions", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.resetModules();
        mockRequireUser.mockReset();
        mockRequireUser.mockResolvedValue({
            id: "user_1",
            accountId: "account_a",
        });
        resetStubAttachmentStoreForTests();
        process.env = {
            ...originalEnv,
            PLATFORM_SHELL_FE_DATA_SOURCE: "stub",
        };
        delete process.env.DATABASE_URL;
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("returns 401 when session is missing", async () => {
        mockRequireUser.mockRejectedValue(new Error("unauthorized"));

        const { POST } = await import("@/app/api/attachments/versions/route");
        const response = await POST(
            createJsonRequest({
                attachmentId: "att_api_1",
                fileName: "file.pdf",
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toBe("Unauthorized");
    });

    it("returns 503 in backend mode", async () => {
        process.env.PLATFORM_SHELL_FE_DATA_SOURCE = "backend";
        process.env.DATABASE_URL = "postgres://localhost/test";

        const { POST } = await import("@/app/api/attachments/versions/route");
        const response = await POST(
            createJsonRequest({
                attachmentId: "att_api_1",
                fileName: "file.pdf",
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(503);
        expect(body.error).toMatch(/not available/i);
    });

    it("uploads a new attachment version and returns generic identifiers", async () => {
        const { POST } = await import("@/app/api/attachments/versions/route");
        const { stubDataSourceAdapters: adapters } = await import(
            "@/lib/data-source/stub-adapter"
        );
        const detailBefore = await adapters.attachments.getAttachmentDetail("att_api_1");

        const response = await POST(
            createJsonRequest({
                attachmentId: "att_api_1",
                fileName: "attachment-v-next.pdf",
                mimeType: "application/pdf",
                sizeBytes: 4096,
                validUntil: "2026-12-31",
            }),
        );
        const body = await response.json();
        const detailAfter = await adapters.attachments.getAttachmentDetail("att_api_1");

        expect(response.status).toBe(200);
        expect(body).toEqual({
            attachmentId: "att_api_1",
            versionId: expect.any(String),
            versionNumber: detailBefore.currentVersion.versionNumber + 1,
        });
        expect(detailAfter.currentVersion.versionNumber).toBe(
            detailBefore.currentVersion.versionNumber + 1,
        );
    });

    it("returns 400 for invalid payloads", async () => {
        const { POST } = await import("@/app/api/attachments/versions/route");
        const response = await POST(
            createJsonRequest({
                attachmentId: "",
                fileName: "",
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBe("Invalid request body");
    });
});
