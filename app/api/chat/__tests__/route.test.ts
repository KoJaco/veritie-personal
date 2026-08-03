import { beforeEach, describe, expect, it, jest } from "@jest/globals";

type MockCompletionResponse = {
  choices: Array<{ message: { content: string } }>;
};

const mockCreate = jest.fn<
  (payload: {
    model: string;
    temperature: number;
    messages: Array<{ role: string; content: string }>;
  }) => Promise<MockCompletionResponse>
>();

if (!("Request" in globalThis)) {
  class MockRequest {}
  // next/server request extension requires a global Request constructor
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

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe("POST /api/chat", () => {
  beforeEach(() => {
    jest.resetModules();
    mockCreate.mockReset();
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "test-model";
  });

  it("builds OpenAI request with filtered roles and returns assistant content", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "assistant response" } }],
    });

    const { POST } = await import("@/app/api/chat/route");

    const request = {
      json: async () => ({
        threadKey: "task:123",
        context: { scope: { type: "task_detail", id: "123" } },
        messages: [
          { id: "u1", role: "user", content: "hi" },
          { id: "s1", role: "system", content: "ignore me" },
          { id: "a1", role: "assistant", content: "previous" },
        ],
      }),
    } as never;

    const response = await POST(request);
    const body = await response.json();

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "test-model",
        temperature: 0.7,
        messages: [
          expect.objectContaining({ role: "system" }),
          { role: "user", content: "hi" },
          { role: "assistant", content: "previous" },
        ],
      }),
    );
    expect(body).toEqual({ content: "assistant response" });
  });

  it("returns 500 when OpenAI call fails", async () => {
    mockCreate.mockRejectedValue(new Error("boom"));

    const { POST } = await import("@/app/api/chat/route");

    const request = {
      json: async () => ({
        threadKey: "task:123",
        context: null,
        messages: [{ id: "u1", role: "user", content: "hello" }],
      }),
    } as never;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to process chat request" });
  });
});
