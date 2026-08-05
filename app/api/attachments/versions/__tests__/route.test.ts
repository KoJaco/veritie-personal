import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { resetStubAttachmentStoreForTests } from "@/lib/data-source";

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

describe("POST /api/attachments/versions", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.resetModules();
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

    it("uploads a new attachment version and returns generic identifiers", async () => {
        const { POST } = await import("@/app/api/attachments/versions/route");
        const { stubDataSourceAdapters: adapters } = await import(
            "@/lib/data-source/stub-adapter"
        );
        const detailBefore = await adapters.attachments.getAttachmentDetail("att_api_1");
        const request = {
            json: async () => ({
                attachmentId: "att_api_1",
                fileName: "attachment-v-next.pdf",
                mimeType: "application/pdf",
                sizeBytes: 4096,
                validUntil: "2026-12-31",
            }),
        } as never;

        const response = await POST(request);
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
        const request = {
            json: async () => ({
                attachmentId: "",
                fileName: "",
            }),
        } as never;

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({
            error: "attachmentId and fileName are required",
        });
    });
});
