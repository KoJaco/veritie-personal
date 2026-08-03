import { describe, expect, it, vi } from "vitest";

import { VeritieSDK } from "./veritie-sdk";
import { VeritieSDKError } from "../errors";
import { jsonResponse, textStreamResponse } from "../test-helpers";

const APP_ALIAS = "field-service-au";

describe("VeritieSDK", () => {
  it("sends create requests to /v1/jobs with idempotency key header", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.example.test/v1/jobs");
      expect(init?.method).toBe("POST");
      expect((init?.headers as Headers).get("Authorization")).toBe("Bearer secret");
      expect((init?.headers as Headers).get("X-Veritie-Pipeline")).toBe(APP_ALIAS);
      expect((init?.headers as Headers).get("Idempotency-Key")).toBe("create-1");
      expect(JSON.parse(String(init?.body))).toEqual({
        audio_content_type: "audio/wav",
        audio_size_bytes: 128,
      });

      return jsonResponse({
        job_id: "job-1",
        status: "awaiting_upload",
        status_url: "/v1/jobs/job-1",
        stream_url: "/v1/jobs/job-1/stream",
        upload: {
          method: "PUT",
          url: "https://upload.example.test/put",
          audio_uri: "supabase://audio/jobs/job-1/source",
          required_mime_type: "audio/wav",
        },
      });
    });

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      apiKey: "secret",
      fetch: fetchMock as typeof fetch,
    });

    const response = await client.createJob(
      {
        audio_content_type: "audio/wav",
        audio_size_bytes: 128,
      },
      { idempotencyKey: "create-1" },
    );

    expect(response.job_id).toBe("job-1");
  });

  it("supports X-API-Key auth", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect((init?.headers as Headers).get("X-API-Key")).toBe("secret");
      expect((init?.headers as Headers).get("Authorization")).toBeNull();
      expect((init?.headers as Headers).get("X-Veritie-Pipeline")).toBe(APP_ALIAS);
      return jsonResponse({
        job_id: "job-1",
        status: "completed",
        accepted_request: { audio_content_type: "audio/wav" },
        transcript_state: "completed",
        extraction_state: "completed",
        tool_suggestion_state: "skipped",
        background_processing: false,
        transcript_ready: true,
        events: [
          {
            ID: "event-1",
            JobID: "job-1",
            Type: "completed",
            Level: "info",
            Message: "done",
            Progress: 1,
            Data: Buffer.from(JSON.stringify({ stage: "finalization" })).toString("base64"),
            CreatedAt: "2026-03-17T00:00:00Z",
          },
        ],
      });
    });

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      apiKey: "secret",
      apiKeyHeader: "X-API-Key",
      fetch: fetchMock as typeof fetch,
    });

    const response = await client.getJob("job-1");
    expect(response.job_id).toBe("job-1");
    expect(response.events[0]).toMatchObject({
      type: "completed",
      level: "info",
      data: { stage: "finalization" },
    });
    expect(response.transcript_state).toBe("completed");
    expect(response.tool_suggestion_state).toBe("skipped");
    expect(response.runtime.session_lease.lease_version).toBe("v0");
    expect(response.transcript_ready).toBe(true);
  });

  it("parses audio_persisted from getJob responses", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        job_id: "job-audio",
        status: "queued",
        accepted_request: { audio_content_type: "audio/wav" },
        background_processing: false,
        transcript_ready: false,
        audio_persisted: true,
        events: [],
      }),
    );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const response = await client.getJob("job-audio");
    expect(response.audio_persisted).toBe(true);
    expect(response.transcript_ready).toBe(false);
  });

  it("sends getPipelineConfig requests to /v1/pipeline/config", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.example.test/v1/pipeline/config");
      expect(init?.method).toBe("GET");
      expect((init?.headers as Headers).get("Authorization")).toBe("Bearer secret");
      expect((init?.headers as Headers).get("X-Veritie-Pipeline")).toBe(APP_ALIAS);

      return jsonResponse({
        version: "v1",
        app: { id: "app-1", name: "Field Service" },
        pipeline: {
          id: "pipeline-1",
          name: "AU Pipeline",
          alias: APP_ALIAS,
        },
        settings: {
          entities_enabled: true,
          actions_enabled: false,
          action_mode: "suggest_only",
          ingest_mode: "batch_first",
        },
        schema: {
          id: "schema-1",
          version_id: "schema-version-1",
          version: 1,
          definition: { entities: [] },
        },
        glossary: {
          id: "glossary-1",
          version_id: "glossary-version-1",
          version: 1,
          definition: { entries: [] },
        },
        warnings: [],
      });
    });

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      apiKey: "secret",
      fetch: fetchMock as typeof fetch,
    });

    const response = await client.getPipelineConfig();
    expect(response.version).toBe("v1");
    expect(response.pipeline.alias).toBe(APP_ALIAS);
    expect(response.schema.definition).toEqual({ entities: [] });
  });

  it("does not invent a tool skip reason for historical non-skipped tool state", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        job_id: "job-1",
        status: "failed",
        accepted_request: { audio_content_type: "audio/wav" },
        transcript_state: "completed",
        extraction_state: "failed",
        tool_suggestion_state: "failed",
        events: [],
      }),
    );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const response = await client.getJob("job-1");
    expect(response.tool_suggestion_state).toBe("failed");
    expect(response.tool_suggestion_skip_reason).toBeUndefined();
  });

  it("preserves transcript segment speaker labels from job detail responses", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        job_id: "job-1",
        status: "completed",
        accepted_request: { audio_content_type: "audio/wav" },
        transcript: {
          text: "hello world",
          provider: "deepgram",
          segments: [
            {
              start_ms: 0,
              end_ms: 900,
              text: "hello world",
              speaker_label: "Speaker 0",
            },
          ],
        },
        events: [],
      }),
    );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const response = await client.getJob("job-1");
    expect(response.transcript?.segments?.[0]?.speaker_label).toBe("Speaker 0");
  });

  it("decodes job detail event payloads without relying on Buffer", async () => {
    const originalAtob = globalThis.atob;
    const encoded = Buffer.from(JSON.stringify({ stage: "ingest", ok: true }), "utf8").toString("base64");
    const originalBufferFrom = Buffer.from;

    vi.stubGlobal("atob", (input: string) => originalBufferFrom(input, "base64").toString("binary"));
    const bufferFromSpy = vi
      .spyOn(Buffer, "from")
      .mockImplementation(((input: string | ArrayBuffer | SharedArrayBuffer, encoding?: BufferEncoding) => {
        if (typeof input === "string" && encoding === "base64" && input === encoded) {
          throw new Error("base64 decode should not use Buffer.from");
        }
        return originalBufferFrom(input as never, encoding as never);
      }) as unknown as typeof Buffer.from);

    const fetchMock = vi.fn(async () =>
      jsonResponse({
        job_id: "job-1",
        status: "queued",
        accepted_request: { audio_content_type: "audio/wav" },
        events: [
          {
            ID: "event-1",
            Type: "progress",
            Level: "info",
            Message: "ingest",
            Progress: 0.5,
            Data: encoded,
          },
        ],
      }),
    );

    try {
      const client = new VeritieSDK({
        baseUrl: "https://api.example.test",
        pipelineAlias: APP_ALIAS,
        fetch: fetchMock as typeof fetch,
      });

      const response = await client.getJob("job-1");
      expect(response.events[0]?.data).toEqual({ stage: "ingest", ok: true });
    } finally {
      bufferFromSpy.mockRestore();
      if (originalAtob) {
        vi.stubGlobal("atob", originalAtob);
      } else {
        Reflect.deleteProperty(globalThis, "atob");
      }
    }
  });

  it("maps server json errors into SDK errors", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        {
          error: "invalid_request",
          message: "audio_uri must match the issued upload target",
        },
        { status: 400 },
      ),
    );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    await expect(client.finalizeUpload("job-1", { audio_uri: "supabase://audio/jobs/job-1/source" })).rejects.toMatchObject({
      code: "invalid_request",
      status: 400,
    } satisfies Partial<VeritieSDKError>);
  });

  it("uploads to a signed url with enforced content type", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://upload.example.test/put");
      expect(init?.method).toBe("PUT");
      expect((init?.headers as Headers).get("x-upsert")).toBe("false");
      expect((init?.headers as Headers).get("Content-Type")).toBeNull();
      expect(init?.body).toBeInstanceOf(FormData);
      return new Response(null, { status: 200 });
    });

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const dateNowSpy = vi
      .spyOn(Date, "now")
      .mockReturnValueOnce(1_710_000_000_000)
      .mockReturnValueOnce(1_710_000_000_125);

    try {
      const upload = await client.uploadToSignedUrl(
        {
          method: "PUT",
          url: "https://upload.example.test/put",
          audio_uri: "supabase://audio/jobs/job-1/source",
          required_mime_type: "audio/wav",
          issued_at: "2026-03-31T07:10:00.000Z",
        },
        new Blob(["audio"], { type: "audio/wav" }),
      );

      expect(upload.telemetry).toEqual({
        upload_instruction_issued_at: "2026-03-31T07:10:00.000Z",
        upload_ack_received_at: "2024-03-09T16:00:00.125Z",
        client_upload_duration_ms: 125,
        file_size_bytes: 5,
      });
    } finally {
      dateNowSpy.mockRestore();
    }
  });

  it("rejects mismatched upload mime types before sending bytes", async () => {
    const fetchMock = vi.fn();
    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    await expect(
      client.uploadToSignedUrl(
        {
          method: "PUT",
          url: "https://upload.example.test/put",
          audio_uri: "supabase://audio/jobs/job-1/source",
          required_mime_type: "audio/wav",
        },
        new Blob(["audio"], { type: "audio/mpeg" }),
      ),
    ).rejects.toMatchObject({ code: "content_type_mismatch" });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates, uploads, and finalizes through the helper flow", async () => {
    const finalizeSpy = vi.fn();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-1",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-1",
          stream_url: "/v1/jobs/job-1/stream",
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            audio_uri: "supabase://audio/jobs/job-1/source",
            issued_at: "2026-03-31T07:10:00.000Z",
          },
        }),
      )
      .mockImplementationOnce(async () => new Response(null, { status: 200 }))
      .mockImplementationOnce(async (_input: RequestInfo | URL, init?: RequestInit) => {
        finalizeSpy(JSON.parse(String(init?.body)));
        return jsonResponse({
          job_id: "job-1",
          status: "queued",
          status_url: "/v1/jobs/job-1",
          stream_url: "/v1/jobs/job-1/stream",
        });
      });

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const dateNowSpy = vi
      .spyOn(Date, "now")
      .mockReturnValueOnce(1_710_000_000_000)
      .mockReturnValueOnce(1_710_000_000_250);

    try {
      const result = await client.createAndUploadJob({
        create: { audio_content_type: "audio/wav" },
        file: new Blob(["audio"], { type: "audio/wav" }),
      });

      expect(result.bootstrap.status).toBe("awaiting_upload");
      expect(result.job.status).toBe("queued");
      expect(finalizeSpy).toHaveBeenCalledWith({
        audio_uri: "supabase://audio/jobs/job-1/source",
        upload_instruction_issued_at: "2026-03-31T07:10:00.000Z",
        upload_ack_received_at: "2024-03-09T16:00:00.250Z",
        client_upload_duration_ms: 250,
        file_size_bytes: 5,
      });
    } finally {
      dateNowSpy.mockRestore();
    }
  });

  it("creates and streams a prerecorded file through the live websocket path", async () => {
    const sockets: FakeWebSocket[] = [];
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        job_id: "job-live-1",
        status: "awaiting_upload",
        status_url: "/v1/jobs/job-live-1",
        stream_url: "/v1/jobs/job-live-1/stream",
        upload: {
          method: "PUT",
          url: "https://upload.example.test/put",
          audio_uri: "supabase://audio/jobs/job-live-1/source",
        },
        stream_ingest: {
          session_id: "session-1",
          websocket_url: "wss://live.example.test/v1/jobs/job-live-1/live?token=abc",
          codec: "audio/wav",
          chunk_target_ms: 250,
          expected_checksum_algorithm: "sha256",
          max_duration_ms: 900000,
        },
      }),
    );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
      webSocketFactory: (url) => {
        const socket = new FakeWebSocket(url);
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
    });

    const result = await client.createAndStreamJob({
      create: { audio_content_type: "audio/wav" },
      file: new Blob(["hello"], { type: "audio/wav" }),
    });

    expect(result.mode).toBe("live");
    if (result.mode !== "live") {
      throw new Error("expected live mode");
    }
    expect(result.session.sessionId).toBe("session-1");
    expect(sockets).toHaveLength(1);
    expect(sockets[0]?.url).toBe("wss://live.example.test/v1/jobs/job-live-1/live?token=abc");
    expect(JSON.parse(String(sockets[0]?.sent[0]))).toMatchObject({
      type: "STREAM_START",
      session_id: "session-1",
      codec: "audio/wav",
      content_type: "audio/wav",
    });
    expect(JSON.parse(String(sockets[0]?.sent[1]))).toMatchObject({
      type: "AUDIO_CHUNK",
      sequence: 0,
      offset_bytes: 0,
      size_bytes: 5,
    });
    expect(sockets[0]?.sent[2]).toBeInstanceOf(Uint8Array);
    expect(JSON.parse(String(sockets[0]?.sent[3]))).toMatchObject({
      type: "STREAM_END",
      last_sequence: 0,
      total_bytes: 5,
    });
  });

  it("prepares upload handles with ready lease state", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        job_id: "job-prepared-1",
        status: "awaiting_upload",
        status_url: "/v1/jobs/job-prepared-1",
        stream_url: "/v1/jobs/job-prepared-1/stream",
        upload: {
          method: "PUT",
          url: "https://upload.example.test/put",
          audio_uri: "supabase://audio/jobs/job-prepared-1/source",
        },
      }),
    );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const handle = await client.prepareUpload(
      { audio_content_type: "audio/wav", audio_size_bytes: 5 },
      { transportPolicy: "batch_only" },
    );

    expect(handle.snapshot.kind).toBe("upload");
    expect(handle.snapshot.transportPolicy).toBe("batch_only");
    expect(handle.snapshot.jobId).toBe("job-prepared-1");
    expect(handle.snapshot.runtime.overall).toBe("ready");
    expect(handle.snapshot.leaseStatus).toBe("prepared");
  });

  it("streams prepared handles before start and rejects stream reuse after consume", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-stream-before-start",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-stream-before-start",
          stream_url: "/v1/jobs/job-stream-before-start/stream",
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            audio_uri: "supabase://audio/jobs/job-stream-before-start/source",
          },
        }),
      )
      .mockImplementationOnce(async () =>
        textStreamResponse([
          "id: event-1\nevent: accepted\ndata: {\"job_id\":\"job-stream-before-start\",\"timestamp\":\"2026-05-26T00:00:00Z\",\"level\":\"info\",\"progress\":0,\"message\":\"accepted\"}\n\n",
        ]),
      )
      .mockImplementationOnce(async () => new Response(null, { status: 200 }))
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-stream-before-start",
          status: "queued",
          status_url: "/v1/jobs/job-stream-before-start",
          stream_url: "/v1/jobs/job-stream-before-start/stream",
        }),
      );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const handle = await client.prepareUpload(
      { audio_content_type: "audio/wav", audio_size_bytes: 5 },
      { transportPolicy: "batch_only" },
    );

    const subscription = await handle.stream();
    await subscription.completed;

    expect(handle.snapshot.lastEvent?.event).toBe("accepted");
    expect(handle.snapshot.leaseStatus).toBe("prepared");

    await handle.startUpload(new Blob(["audio"], { type: "audio/wav" }));

    await expect(handle.stream()).rejects.toMatchObject({
      code: "pipeline_handle_consumed",
    } satisfies Partial<VeritieSDKError>);
  });

  it("prepares capture handles and marks them consumed once live capture starts", async () => {
    const sockets: FakeWebSocket[] = [];
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        job_id: "job-capture-1",
        status: "awaiting_upload",
        status_url: "/v1/jobs/job-capture-1",
        stream_url: "/v1/jobs/job-capture-1/stream",
        upload: {
          method: "PUT",
          url: "https://upload.example.test/put",
          audio_uri: "supabase://audio/jobs/job-capture-1/source",
        },
        stream_ingest: {
          session_id: "session-capture-1",
          websocket_url: "wss://live.example.test/v1/jobs/job-capture-1/live?token=abc",
          codec: "audio/wav",
          chunk_target_ms: 250,
          expected_checksum_algorithm: "sha256",
          max_duration_ms: 900000,
        },
      }),
    );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
      webSocketFactory: (url) => {
        const socket = new FakeWebSocket(url);
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
    });

    const handle = await client.prepareCapture(
      { audio_content_type: "audio/wav", audio_size_bytes: 5 },
      { transportPolicy: "auto" },
    );
    const session = await handle.startCapture();

    expect(session.sessionId).toBe("session-capture-1");
    expect(handle.snapshot.transportPolicy).toBe("live_only");
    expect(handle.snapshot.leaseStatus).toBe("consumed");
    expect(handle.snapshot.runtime.overall).toBe("capturing");
    expect(sockets).toHaveLength(1);
  });

  it("rejects starting capture more than once from the same handle", async () => {
    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: vi.fn(async () =>
        jsonResponse({
          job_id: "job-capture-once",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-capture-once",
          stream_url: "/v1/jobs/job-capture-once/stream",
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            audio_uri: "supabase://audio/jobs/job-capture-once/source",
          },
          stream_ingest: {
            session_id: "session-capture-once",
            websocket_url: "wss://live.example.test/v1/jobs/job-capture-once/live?token=abc",
            codec: "audio/wav",
            chunk_target_ms: 250,
            expected_checksum_algorithm: "sha256",
            max_duration_ms: 900000,
          },
        }),
      ) as typeof fetch,
      webSocketFactory: (url) => new FakeWebSocket(url) as unknown as WebSocket,
    });

    const handle = await client.prepareCapture({ audio_content_type: "audio/wav" });
    await handle.startCapture();

    await expect(handle.startCapture()).rejects.toMatchObject({
      code: "pipeline_handle_consumed",
    } satisfies Partial<VeritieSDKError>);
  });

  it("falls back to batch from prepared auto upload handles before live bytes are sent", async () => {
    const finalizeSpy = vi.fn();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-auto-1",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-auto-1",
          stream_url: "/v1/jobs/job-auto-1/stream",
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            audio_uri: "supabase://audio/jobs/job-auto-1/source",
          },
          stream_ingest: {
            session_id: "session-auto-1",
            websocket_url: "wss://live.example.test/v1/jobs/job-auto-1/live?token=abc",
            codec: "audio/wav",
            chunk_target_ms: 250,
            expected_checksum_algorithm: "sha256",
            max_duration_ms: 900000,
          },
        }),
      )
      .mockImplementationOnce(async () => new Response(null, { status: 200 }))
      .mockImplementationOnce(async (_input: RequestInfo | URL, init?: RequestInit) => {
        finalizeSpy(JSON.parse(String(init?.body)));
        return jsonResponse({
          job_id: "job-auto-1",
          status: "queued",
          status_url: "/v1/jobs/job-auto-1",
          stream_url: "/v1/jobs/job-auto-1/stream",
        });
      });

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
      webSocketFactory: () => {
        throw new Error("socket unavailable");
      },
    });

    const handle = await client.prepareUpload(
      { audio_content_type: "audio/wav", audio_size_bytes: 5 },
      { transportPolicy: "auto" },
    );
    const result = await handle.startUpload(
      new Blob(["audio"], { type: "audio/wav" }),
    );

    expect(result.mode).toBe("batch");
    if (result.mode !== "batch") {
      throw new Error("expected batch fallback");
    }
    expect(result.fallbackReason).toBe("live_open_failed");
    expect(result.liveErrorCode).toBe("live_open_failed");
    expect(handle.snapshot.leaseStatus).toBe("consumed");
    expect(finalizeSpy).toHaveBeenCalledWith(expect.objectContaining({
      audio_uri: "supabase://audio/jobs/job-auto-1/source",
    }));
  });

  it("rejects starting upload more than once from the same handle", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-upload-once",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-upload-once",
          stream_url: "/v1/jobs/job-upload-once/stream",
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            audio_uri: "supabase://audio/jobs/job-upload-once/source",
          },
        }),
      )
      .mockImplementationOnce(async () => new Response(null, { status: 200 }))
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-upload-once",
          status: "queued",
          status_url: "/v1/jobs/job-upload-once",
          stream_url: "/v1/jobs/job-upload-once/stream",
        }),
      );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const handle = await client.prepareUpload(
      { audio_content_type: "audio/wav", audio_size_bytes: 5 },
      { transportPolicy: "batch_only" },
    );
    await handle.startUpload(new Blob(["audio"], { type: "audio/wav" }));

    await expect(
      handle.startUpload(new Blob(["audio"], { type: "audio/wav" })),
    ).rejects.toMatchObject({
      code: "pipeline_handle_consumed",
    } satisfies Partial<VeritieSDKError>);
  });

  it("submitAndDetach uploads, finalizes, and resolves at audio_persisted", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-detach-1",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-detach-1",
          stream_url: "/v1/jobs/job-detach-1/stream",
          audio_persisted: false,
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            headers: { "Content-Type": "audio/wav" },
            audio_uri: "supabase://audio/jobs/job-detach-1/source",
          },
        }),
      )
      .mockImplementationOnce(async () => new Response(null, { status: 200 }))
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-detach-1",
          status: "queued",
          status_url: "/v1/jobs/job-detach-1",
          stream_url: "/v1/jobs/job-detach-1/stream",
          audio_persisted: true,
        }),
      );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const handle = await client.prepareUpload(
      { audio_content_type: "audio/wav", audio_size_bytes: 5 },
      { transportPolicy: "batch_only" },
    );
    const result = await handle.submitAndDetach(
      new Blob(["audio"], { type: "audio/wav" }),
    );

    expect(result).toMatchObject({
      jobId: "job-detach-1",
      status: "queued",
      statusUrl: "/v1/jobs/job-detach-1",
      streamUrl: "/v1/jobs/job-detach-1/stream",
      audio_persisted: true,
    });
    expect(handle.snapshot.streamSubscription).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("rejects submitAndDetach on capture handles", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        job_id: "job-capture-detach",
        status: "awaiting_upload",
        status_url: "/v1/jobs/job-capture-detach",
        stream_url: "/v1/jobs/job-capture-detach/stream",
        upload: {
          method: "PUT",
          url: "https://upload.example.test/put",
          audio_uri: "supabase://audio/jobs/job-capture-detach/source",
        },
        stream_ingest: {
          session_id: "session-1",
          websocket_url: "wss://live.example.test/ws",
          codec: "audio/pcm",
          chunk_target_ms: 100,
          expected_checksum_algorithm: "sha256",
          max_duration_ms: 60000,
        },
      }),
    );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const handle = await client.prepareCapture({
      audio_content_type: "audio/wav",
    });

    await expect(
      handle.submitAndDetach(new Blob(["audio"], { type: "audio/wav" })),
    ).rejects.toMatchObject({
      code: "invalid_pipeline_handle",
    } satisfies Partial<VeritieSDKError>);
  });

  it("rejects submitAndDetach when transport is not batch_only", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        job_id: "job-auto-detach",
        status: "awaiting_upload",
        status_url: "/v1/jobs/job-auto-detach",
        stream_url: "/v1/jobs/job-auto-detach/stream",
        upload: {
          method: "PUT",
          url: "https://upload.example.test/put",
          audio_uri: "supabase://audio/jobs/job-auto-detach/source",
        },
      }),
    );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const handle = await client.prepareUpload(
      { audio_content_type: "audio/wav" },
      { transportPolicy: "auto" },
    );

    await expect(
      handle.submitAndDetach(new Blob(["audio"], { type: "audio/wav" })),
    ).rejects.toMatchObject({
      code: "invalid_transport_policy",
    } satisfies Partial<VeritieSDKError>);
  });

  it("marks prepared handles aborted on close and blocks further lifecycle actions", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-close-1",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-close-1",
          stream_url: "/v1/jobs/job-close-1/stream",
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            audio_uri: "supabase://audio/jobs/job-close-1/source",
          },
        }),
      )
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-close-1",
          status: "awaiting_upload",
          accepted_request: { audio_content_type: "audio/wav" },
          events: [],
          runtime: {
            overall: "ready",
            session_lease: {
              status: "prepared",
              attempt_count: 1,
              lease_version: "v0",
              ingest_mode: "batch_first",
            },
            ingest: { status: "pending", attempt_count: 0 },
            transcript: { status: "pending", attempt_count: 0 },
            extraction: { status: "pending", attempt_count: 0 },
            source_audio: {
              status: "pending",
              attempt_count: 0,
              canonical_audio_state: "pending",
              integrity_state: "not_applicable",
            },
            indexing: { status: "skipped", attempt_count: 0, skip_reason: "not_configured" },
            sink_deliveries: {
              status: "skipped",
              attempt_count: 0,
              skip_reason: "not_configured",
              failure_policy: "non_blocking",
            },
          },
          ingest_mode: "batch_first",
          canonical_audio_state: "pending",
          integrity_state: "not_applicable",
          transcript_state: "pending",
          extraction_state: "pending",
          tool_suggestion_state: "skipped",
          indexing_state: "skipped",
          tool_suggestion_skip_reason: "toolsets_disabled",
          background_processing: false,
          transcript_ready: false,
        }),
      );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const handle = await client.prepareUpload({ audio_content_type: "audio/wav" });
    handle.close();

    expect(handle.snapshot.leaseStatus).toBe("aborted");
    await expect(
      handle.startUpload(new Blob(["audio"], { type: "audio/wav" })),
    ).rejects.toMatchObject({
      code: "pipeline_handle_closed",
    } satisfies Partial<VeritieSDKError>);
    await expect(handle.stream()).rejects.toMatchObject({
      code: "pipeline_handle_closed",
    } satisfies Partial<VeritieSDKError>);

    const detail = await handle.refresh();
    expect(detail.runtime.session_lease.status).toBe("prepared");
    expect(handle.snapshot.leaseStatus).toBe("prepared");
    expect(handle.snapshot.detail?.runtime.session_lease.status).toBe("prepared");
  });

  it("re-prepares live handles once when the initial prepared websocket open is stale", async () => {
    let createCount = 0;
    let socketCount = 0;
    const fetchMock = vi.fn(async () => {
      createCount += 1;
      return jsonResponse({
        job_id: `job-reprepare-${createCount}`,
        status: "awaiting_upload",
        status_url: `/v1/jobs/job-reprepare-${createCount}`,
        stream_url: `/v1/jobs/job-reprepare-${createCount}/stream`,
        upload: {
          method: "PUT",
          url: "https://upload.example.test/put",
          audio_uri: `supabase://audio/jobs/job-reprepare-${createCount}/source`,
        },
        stream_ingest: {
          session_id: `session-reprepare-${createCount}`,
          websocket_url: `wss://live.example.test/v1/jobs/job-reprepare-${createCount}/live?token=abc`,
          codec: "audio/wav",
          chunk_target_ms: 250,
          expected_checksum_algorithm: "sha256",
          max_duration_ms: 900000,
        },
      });
    });

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
      webSocketFactory: () => {
        socketCount += 1;
        if (socketCount === 1) {
          throw new Error("stale lease");
        }
        return new FakeWebSocket(
          "wss://live.example.test/v1/jobs/job-reprepare-2/live?token=abc",
        ) as unknown as WebSocket;
      },
    });

    const handle = await client.prepareCapture({
      audio_content_type: "audio/wav",
      audio_size_bytes: 5,
    });
    const originalHandle = handle;
    const initialJobId = handle.snapshot.jobId;
    const initialSessionId = handle.snapshot.streamSessionId;
    const session = await handle.startCapture();

    expect(createCount).toBe(2);
    expect(handle).toBe(originalHandle);
    expect(initialJobId).toBe("job-reprepare-1");
    expect(handle.snapshot.jobId).not.toBe(initialJobId);
    expect(initialSessionId).toBe("session-reprepare-1");
    expect(session.sessionId).toBe("session-reprepare-2");
    expect(session.sessionId).not.toBe(initialSessionId);
    expect(handle.snapshot.jobId).toBe("job-reprepare-2");
    expect(handle.snapshot.leaseStatus).toBe("consumed");
  });

  it("falls back to batch when a live upload socket closes before the first chunk is sent", async () => {
    let createCount = 0;
    const finalizeSpy = vi.fn();
    const fetchMock = vi
      .fn()
      .mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(_input);
        if (url === "https://api.example.test/v1/jobs") {
          createCount += 1;
          return jsonResponse({
            job_id: `job-pre-byte-${createCount}`,
            status: "awaiting_upload",
            status_url: `/v1/jobs/job-pre-byte-${createCount}`,
            stream_url: `/v1/jobs/job-pre-byte-${createCount}/stream`,
            upload: {
              method: "PUT",
              url: "https://upload.example.test/put",
              audio_uri: `supabase://audio/jobs/job-pre-byte-${createCount}/source`,
            },
            stream_ingest: {
              session_id: `session-pre-byte-${createCount}`,
              websocket_url: `wss://live.example.test/v1/jobs/job-pre-byte-${createCount}/live?token=abc`,
              codec: "audio/wav",
              chunk_target_ms: 250,
              expected_checksum_algorithm: "sha256",
              max_duration_ms: 900000,
            },
          });
        }
        if (url === "https://upload.example.test/put") {
          return new Response(null, { status: 200 });
        }
        finalizeSpy(JSON.parse(String(init?.body)));
        return jsonResponse({
          job_id: `job-pre-byte-${createCount}`,
          status: "queued",
          status_url: `/v1/jobs/job-pre-byte-${createCount}`,
          stream_url: `/v1/jobs/job-pre-byte-${createCount}/stream`,
        });
      });

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
      webSocketFactory: (url) =>
        new FakeWebSocket(url, {
          onSend(data, socket) {
            if (
              typeof data === "string" &&
              data.includes("\"AUDIO_CHUNK\"")
            ) {
              socket.closeWithEvent(1011, "closed before first chunk");
            } else if (
              !(typeof data === "string" && data.includes("\"STREAM_START\""))
            ) {
              throw new VeritieSDKError({
                code: "live_session_closed",
                message: "Live session is already closed",
              });
            }
          },
        }) as unknown as WebSocket,
    });

    const handle = await client.prepareUpload(
      { audio_content_type: "audio/wav", audio_size_bytes: 5 },
      { transportPolicy: "auto" },
    );
    const result = await handle.startUpload(
      new Blob(["audio"], { type: "audio/wav" }),
    );

    expect(result.mode).toBe("batch");
    if (result.mode !== "batch") {
      throw new Error("expected batch fallback");
    }
    expect(result.fallbackReason).toBe("live_open_failed");
    expect(createCount).toBe(2);
    expect(finalizeSpy).toHaveBeenCalledWith(expect.objectContaining({
      audio_uri: "supabase://audio/jobs/job-pre-byte-2/source",
    }));
  });

  it("does not fall back to batch after the first live chunk is sent", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        job_id: "job-no-fallback-after-byte",
        status: "awaiting_upload",
        status_url: "/v1/jobs/job-no-fallback-after-byte",
        stream_url: "/v1/jobs/job-no-fallback-after-byte/stream",
        upload: {
          method: "PUT",
          url: "https://upload.example.test/put",
          audio_uri: "supabase://audio/jobs/job-no-fallback-after-byte/source",
        },
        stream_ingest: {
          session_id: "session-no-fallback-after-byte",
          websocket_url: "wss://live.example.test/v1/jobs/job-no-fallback-after-byte/live?token=abc",
          codec: "audio/wav",
          chunk_target_ms: 250,
          expected_checksum_algorithm: "sha256",
          max_duration_ms: 900000,
        },
      }),
    );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
      webSocketFactory: (url) =>
        new FakeWebSocket(url, {
          onSend(data, socket) {
            if (socket.readyState === 3) {
              throw new VeritieSDKError({
                code: "live_session_closed",
                message: "Live session is already closed",
              });
            }
            if (
              typeof data === "string" &&
              data.includes("\"AUDIO_CHUNK\"") &&
              data.includes("\"sequence\":1")
            ) {
              socket.closeWithEvent(1011, "closed after first chunk");
            }
          },
        }) as unknown as WebSocket,
    });

    const handle = await client.prepareUpload(
      { audio_content_type: "audio/wav", audio_size_bytes: 2 },
      { transportPolicy: "auto" },
    );

    await expect(
      handle.startUpload(new Blob(["ab"], { type: "audio/wav" }), {
        live: { chunkSizeBytes: 1 },
      }),
    ).rejects.toMatchObject({
      code: "live_session_closed",
    } satisfies Partial<VeritieSDKError>);
  });

  it("updates live-first source audio state from handle stream events before refresh", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-stream-parity",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-stream-parity",
          stream_url: "/v1/jobs/job-stream-parity/stream",
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            audio_uri: "supabase://audio/jobs/job-stream-parity/source",
          },
          stream_ingest: {
            session_id: "session-stream-parity",
            websocket_url: "wss://live.example.test/v1/jobs/job-stream-parity/live?token=abc",
            codec: "audio/wav",
            chunk_target_ms: 250,
            expected_checksum_algorithm: "sha256",
            max_duration_ms: 900000,
          },
        }),
      )
      .mockImplementationOnce(async () =>
        textStreamResponse([
          "id: event-1\nevent: upload_verified\ndata: {\"job_id\":\"job-stream-parity\",\"timestamp\":\"2026-05-26T00:00:00Z\",\"level\":\"info\",\"progress\":0.4,\"message\":\"verified\"}\n\n",
        ]),
      )
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-stream-parity",
          status: "running",
          accepted_request: { audio_content_type: "audio/wav" },
          events: [],
          runtime: {
            overall: "transcribing",
            session_lease: {
              status: "consumed",
              attempt_count: 1,
              lease_version: "v0",
              ingest_mode: "live_first",
              stream_session_id: "session-stream-parity",
            },
            ingest: { status: "completed", attempt_count: 1 },
            transcript: { status: "running", attempt_count: 1 },
            extraction: { status: "pending", attempt_count: 0 },
            source_audio: {
              status: "completed",
              attempt_count: 1,
              canonical_audio_state: "completed",
              integrity_state: "verified",
            },
            indexing: { status: "skipped", attempt_count: 0, skip_reason: "not_configured" },
            sink_deliveries: {
              status: "skipped",
              attempt_count: 0,
              skip_reason: "not_configured",
              failure_policy: "non_blocking",
            },
          },
          ingest_mode: "live_first",
          stream_session_id: "session-stream-parity",
          canonical_audio_state: "completed",
          integrity_state: "verified",
          transcript_state: "running",
          extraction_state: "pending",
          tool_suggestion_state: "skipped",
          indexing_state: "skipped",
          tool_suggestion_skip_reason: "toolsets_disabled",
          background_processing: true,
          transcript_ready: false,
        }),
      );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const handle = await client.prepareUpload(
      { audio_content_type: "audio/wav" },
      { transportPolicy: "live_only" },
    );
    const subscription = await handle.stream();
    await subscription.completed;

    expect(handle.snapshot.runtime.source_audio).toMatchObject({
      status: "completed",
      canonical_audio_state: "completed",
      integrity_state: "verified",
    });

    const detail = await handle.refresh();
    expect(detail.runtime.source_audio).toMatchObject({
      status: "completed",
      canonical_audio_state: "completed",
      integrity_state: "verified",
    });
  });

  it("falls back to batch upload when live bootstrap capability is absent", async () => {
    const finalizeSpy = vi.fn();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-1",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-1",
          stream_url: "/v1/jobs/job-1/stream",
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            audio_uri: "supabase://audio/jobs/job-1/source",
          },
        }),
      )
      .mockImplementationOnce(async () => new Response(null, { status: 200 }))
      .mockImplementationOnce(async (_input: RequestInfo | URL, init?: RequestInit) => {
        finalizeSpy(JSON.parse(String(init?.body)));
        return jsonResponse({
          job_id: "job-1",
          status: "queued",
          status_url: "/v1/jobs/job-1",
          stream_url: "/v1/jobs/job-1/stream",
        });
      });

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const result = await client.createAndStreamJob({
      create: { audio_content_type: "audio/wav" },
      file: new Blob(["audio"], { type: "audio/wav" }),
    });

    expect(result.mode).toBe("batch");
    if (result.mode !== "batch") {
      throw new Error("expected batch fallback");
    }
    expect(result.job.status).toBe("queued");
    expect(result.fallback_reason).toBe("bootstrap_unavailable");
    expect(finalizeSpy).toHaveBeenCalledWith(expect.objectContaining({
      audio_uri: "supabase://audio/jobs/job-1/source",
    }));
  });

  it("returns live-open diagnostics when websocket fallback downgrades to batch", async () => {
    const finalizeSpy = vi.fn();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-live-2",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-live-2",
          stream_url: "/v1/jobs/job-live-2/stream",
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            audio_uri: "supabase://audio/jobs/job-live-2/source",
          },
          stream_ingest: {
            session_id: "session-2",
            websocket_url: "wss://live.example.test/v1/jobs/job-live-2/live?token=abc",
            codec: "audio/wav",
            chunk_target_ms: 250,
            expected_checksum_algorithm: "sha256",
            max_duration_ms: 900000,
          },
        }),
      )
      .mockImplementationOnce(async () => new Response(null, { status: 200 }))
      .mockImplementationOnce(async (_input: RequestInfo | URL, init?: RequestInit) => {
        finalizeSpy(JSON.parse(String(init?.body)));
        return jsonResponse({
          job_id: "job-live-2",
          status: "queued",
          status_url: "/v1/jobs/job-live-2",
          stream_url: "/v1/jobs/job-live-2/stream",
        });
      });

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
      webSocketFactory: () => {
        throw new Error("socket unavailable");
      },
    });

    const result = await client.createAndStreamJob({
      create: { audio_content_type: "audio/wav" },
      file: new Blob(["audio"], { type: "audio/wav" }),
    });

    expect(result.mode).toBe("batch");
    if (result.mode !== "batch") {
      throw new Error("expected batch fallback");
    }
    expect(result.job.status).toBe("queued");
    expect(result.fallback_reason).toBe("live_open_failed");
    expect(result.live_error_code).toBe("live_open_failed");
    expect(finalizeSpy).toHaveBeenCalledWith(expect.objectContaining({
      audio_uri: "supabase://audio/jobs/job-live-2/source",
    }));
  });

  it("streams replay events and snapshot with last-event-id support", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect((init?.headers as Headers).get("Authorization")).toBe("Bearer secret");
      expect((init?.headers as Headers).get("X-Veritie-Pipeline")).toBe(APP_ALIAS);
      expect((init?.headers as Headers).get("Last-Event-ID")).toBe("cursor-1");

      return textStreamResponse([
        "id: cursor-2\nevent: accepted\ndata: {\"job_id\":\"job-1\",\"timestamp\":\"2026-03-17T00:00:00Z\",\"level\":\"info\",\"progress\":0,\"message\":\"accepted\"}\n\n",
        ": keepalive\n\n",
        "event: job.snapshot\ndata: {\"job_id\":\"job-1\",\"status\":\"queued\",\"terminal\":false,\"last_event_id\":\"cursor-2\",\"transcript_state\":\"completed\",\"extraction_state\":\"running\",\"tool_suggestion_state\":\"skipped\",\"background_processing\":true,\"transcript_ready\":true}\n\n",
        "id: cursor-3\nevent: completed\ndata: {\"job_id\":\"job-1\",\"timestamp\":\"2026-03-17T00:01:00Z\",\"level\":\"info\",\"progress\":1,\"message\":\"done\"}\n\n",
      ]);
    });

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      apiKey: "secret",
      fetch: fetchMock as typeof fetch,
    });

    const seen: string[] = [];
    const snapshots: Array<Record<string, unknown>> = [];
    const stream = await client.streamJob("job-1", {
      lastEventId: "cursor-1",
      onEvent(event) {
        seen.push(event.event);
        if (event.event === "job.snapshot") {
          snapshots.push(event.data as unknown as Record<string, unknown>);
        }
      },
    });

    await stream.completed;

    expect(seen).toEqual(["accepted", "job.snapshot", "completed"]);
    expect(stream.lastEventId).toBe("cursor-3");
    expect(snapshots[0]).toMatchObject({
      transcript_state: "completed",
      extraction_state: "running",
      tool_suggestion_state: "skipped",
      background_processing: true,
      transcript_ready: true,
      runtime: expect.objectContaining({
        transcript: expect.objectContaining({ status: "completed" }),
        extraction: expect.objectContaining({ status: "running" }),
      }),
    });
  });

  it("prefers nested runtime state over contradictory flat tool fallback", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        job_id: "job-1",
        status: "completed",
        accepted_request: { audio_content_type: "audio/wav" },
        runtime: {
          overall: "completed",
          session_lease: {
            status: "consumed",
            attempt_count: 1,
            lease_version: "v0",
            ingest_mode: "batch_first",
          },
          ingest: { status: "completed", attempt_count: 1 },
          transcript: { status: "completed", attempt_count: 1 },
          extraction: { status: "completed", attempt_count: 1 },
          source_audio: {
            status: "completed",
            attempt_count: 1,
            canonical_audio_state: "completed",
            integrity_state: "not_applicable",
          },
          indexing: { status: "skipped", attempt_count: 0, skip_reason: "not_configured" },
          sink_deliveries: { status: "skipped", attempt_count: 0, skip_reason: "not_configured", failure_policy: "non_blocking" },
        },
        tool_suggestion_state: "failed",
        events: [],
      }),
    );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const response = await client.getJob("job-1");
    expect(response.tool_suggestion_state).toBe("failed");
    expect(response.tool_suggestion_skip_reason).toBeUndefined();
  });

  it("treats post-open network disconnects as recoverable after stream activity", async () => {
    const fetchMock = vi.fn(async () => {
      let emitted = false;

      const body = new ReadableStream<Uint8Array>({
        pull(controller) {
          if (!emitted) {
            emitted = true;
            controller.enqueue(
              new TextEncoder().encode(
                "id: cursor-1\nevent: accepted\ndata: {\"job_id\":\"job-1\",\"timestamp\":\"2026-03-17T00:00:00Z\",\"level\":\"info\",\"progress\":0,\"message\":\"accepted\"}\n\n",
              ),
            );
            return;
          }

          throw new TypeError("network error");
        },
      });

      return new Response(body, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });
    });

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      apiKey: "secret",
      fetch: fetchMock as typeof fetch,
    });

    const seen: string[] = [];
    const onError = vi.fn();
    const stream = await client.streamJob("job-1", {
      onEvent(event) {
        seen.push(event.event);
      },
      onError,
    });

    await expect(stream.completed).resolves.toBeUndefined();
    expect(seen).toEqual(["accepted"]);
    expect(onError).not.toHaveBeenCalled();
    expect(stream.lastEventId).toBe("cursor-1");
  });

  it("treats non-recoverable post-open read failures as fatal", async () => {
    const fetchMock = vi.fn(async () => {
      let emitted = false;

      const body = new ReadableStream<Uint8Array>({
        pull(controller) {
          if (!emitted) {
            emitted = true;
            controller.enqueue(
              new TextEncoder().encode(
                "id: cursor-1\nevent: accepted\ndata: {\"job_id\":\"job-1\",\"timestamp\":\"2026-03-17T00:00:00Z\",\"level\":\"info\",\"progress\":0,\"message\":\"accepted\"}\n\n",
              ),
            );
            return;
          }

          throw new Error("decoder exploded");
        },
      });

      return new Response(body, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });
    });

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      apiKey: "secret",
      fetch: fetchMock as typeof fetch,
    });

    const onError = vi.fn();
    const stream = await client.streamJob("job-1", { onError });

    await expect(stream.completed).rejects.toMatchObject({
      code: "stream_read_failed",
    });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("treats stream open failures as fatal", async () => {
    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      apiKey: "secret",
      fetch: vi.fn(async () => {
        throw new TypeError("failed to fetch");
      }) as typeof fetch,
    });

    const onError = vi.fn();
    const stream = await client.streamJob("job-1", { onError });

    await expect(stream.completed).rejects.toMatchObject({
      code: "stream_open_failed",
    });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("allows per-call app alias overrides on server-bound requests", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect((init?.headers as Headers).get("X-Veritie-Pipeline")).toBe("override-app");
        return jsonResponse({
          job_id: "job-override",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-override",
          stream_url: "/v1/jobs/job-override/stream",
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            audio_uri: "supabase://audio/jobs/job-override/source",
          },
        });
      })
      .mockImplementationOnce(async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect((init?.headers as Headers).get("X-Veritie-Pipeline")).toBe("override-app");
        return jsonResponse({
          job_id: "job-override",
          status: "queued",
          status_url: "/v1/jobs/job-override",
          stream_url: "/v1/jobs/job-override/stream",
        });
      });

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const bootstrap = await client.createJob(
      { audio_content_type: "audio/wav" },
      { pipelineAlias: "override-app" },
    );
    await client.finalizeUpload(
      bootstrap.job_id,
      { audio_uri: bootstrap.upload.audio_uri },
      { pipelineAlias: "override-app" },
    );
  });

  it("rejects empty pipelineAlias before sending protected requests", async () => {
    const fetchMock = vi.fn();
    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: "   ",
      fetch: fetchMock as typeof fetch,
    });

    await expect(client.getJob("job-1")).rejects.toMatchObject({
      code: "invalid_pipeline_alias",
    } satisfies Partial<VeritieSDKError>);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("parses completed and failed evidence indexes from getJob", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        job_id: "job-index-1",
        status: "partial_success",
        accepted_request: { audio_content_type: "audio/wav" },
        events: [],
        extraction: { payload: { name: "alpha" } },
        index: {
          status: "failed",
          builder_version: "v1",
          entries: [],
          error_class: "internal",
        },
        runtime: {
          overall: "completed",
          session_lease: {
            status: "consumed",
            attempt_count: 1,
            lease_version: "v0",
            ingest_mode: "batch_first",
          },
          ingest: { status: "completed", attempt_count: 1 },
          transcript: { status: "completed", attempt_count: 1 },
          extraction: { status: "completed", attempt_count: 1 },
          source_audio: {
            status: "completed",
            attempt_count: 1,
            canonical_audio_state: "completed",
            integrity_state: "not_applicable",
          },
          indexing: { status: "failed", attempt_count: 1 },
          sink_deliveries: {
            status: "skipped",
            attempt_count: 0,
            skip_reason: "not_configured",
            failure_policy: "non_blocking",
          },
        },
        indexing_state: "failed",
        transcript_state: "completed",
        extraction_state: "completed",
        tool_suggestion_state: "skipped",
        background_processing: false,
        transcript_ready: true,
      }),
    );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const response = await client.getJob("job-index-1");
    expect(response.status).toBe("partial_success");
    expect(response.index).toMatchObject({
      status: "failed",
      builder_version: "v1",
      error_class: "internal",
    });
    expect(response.indexing_state).toBe("failed");
    expect(response.runtime.indexing.skip_reason).toBeUndefined();
  });

  it("auto-refreshes prepared handle detail on indexing_completed", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-index-stream",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-index-stream",
          stream_url: "/v1/jobs/job-index-stream/stream",
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            audio_uri: "supabase://audio/jobs/job-index-stream/source",
          },
        }),
      )
      .mockImplementationOnce(async () =>
        textStreamResponse([
          "id: cursor-1\nevent: indexing_completed\ndata: {\"job_id\":\"job-index-stream\",\"timestamp\":\"2026-06-22T00:00:00Z\",\"level\":\"info\",\"progress\":1,\"message\":\"index ready\"}\n\n",
        ]),
      )
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-index-stream",
          status: "completed",
          accepted_request: { audio_content_type: "audio/wav" },
          events: [],
          extraction: { payload: { name: "alpha" } },
          index: {
            status: "completed",
            builder_version: "v1",
            entries: [
              {
                path: "/name",
                status: "matched",
                quote: "alpha",
                segment_ids: ["550e8400-e29b-41d4-a716-446655440000"],
                start_ms: 10,
                end_ms: 20,
                match_method: "exact",
                confidence: 1,
              },
            ],
          },
          runtime: {
            overall: "completed",
            session_lease: {
              status: "consumed",
              attempt_count: 1,
              lease_version: "v0",
              ingest_mode: "batch_first",
            },
            ingest: { status: "completed", attempt_count: 1 },
            transcript: { status: "completed", attempt_count: 1 },
            extraction: { status: "completed", attempt_count: 1 },
            source_audio: {
              status: "completed",
              attempt_count: 1,
              canonical_audio_state: "completed",
              integrity_state: "not_applicable",
            },
            indexing: { status: "completed", attempt_count: 1 },
            sink_deliveries: {
              status: "skipped",
              attempt_count: 0,
              skip_reason: "not_configured",
              failure_policy: "non_blocking",
            },
          },
          indexing_state: "completed",
          transcript_state: "completed",
          extraction_state: "completed",
          tool_suggestion_state: "skipped",
          background_processing: false,
          transcript_ready: true,
        }),
      );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const handle = await client.prepareUpload(
      { audio_content_type: "audio/wav" },
      { transportPolicy: "batch_only" },
    );
    const subscription = await handle.stream();
    await subscription.completed;

    await vi.waitFor(() => {
      expect(handle.snapshot.detail?.index?.entries).toHaveLength(1);
    });
    expect(handle.snapshot.runtime.indexing.status).toBe("completed");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("dedupes replayed indexing refresh events on prepared handles", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-index-replay",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-index-replay",
          stream_url: "/v1/jobs/job-index-replay/stream",
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            audio_uri: "supabase://audio/jobs/job-index-replay/source",
          },
        }),
      )
      .mockImplementationOnce(async () =>
        textStreamResponse([
          "id: cursor-1\nevent: indexing_completed\ndata: {\"job_id\":\"job-index-replay\",\"timestamp\":\"2026-06-22T00:00:00Z\",\"level\":\"info\",\"progress\":1}\n\n",
          "id: cursor-1\nevent: indexing_completed\ndata: {\"job_id\":\"job-index-replay\",\"timestamp\":\"2026-06-22T00:00:00Z\",\"level\":\"info\",\"progress\":1}\n\n",
        ]),
      )
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-index-replay",
          status: "completed",
          accepted_request: { audio_content_type: "audio/wav" },
          events: [],
          index: {
            status: "completed",
            builder_version: "v1",
            entries: [],
          },
          runtime: {
            overall: "completed",
            session_lease: {
              status: "consumed",
              attempt_count: 1,
              lease_version: "v0",
              ingest_mode: "batch_first",
            },
            ingest: { status: "completed", attempt_count: 1 },
            transcript: { status: "completed", attempt_count: 1 },
            extraction: { status: "completed", attempt_count: 1 },
            source_audio: {
              status: "completed",
              attempt_count: 1,
              canonical_audio_state: "completed",
              integrity_state: "not_applicable",
            },
            indexing: { status: "completed", attempt_count: 1 },
            sink_deliveries: {
              status: "skipped",
              attempt_count: 0,
              skip_reason: "not_configured",
              failure_policy: "non_blocking",
            },
          },
          indexing_state: "completed",
          transcript_state: "completed",
          extraction_state: "completed",
          tool_suggestion_state: "skipped",
          background_processing: false,
          transcript_ready: true,
        }),
      );

    const client = new VeritieSDK({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      fetch: fetchMock as typeof fetch,
    });

    const handle = await client.prepareUpload(
      { audio_content_type: "audio/wav" },
      { transportPolicy: "batch_only" },
    );
    const subscription = await handle.stream();
    await subscription.completed;

    await vi.waitFor(() => {
      expect(handle.snapshot.detail?.index?.status).toBe("completed");
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

class FakeWebSocket {
  binaryType: BinaryType = "blob";
  readyState = 0;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  sent: Array<string | ArrayBufferLike | Blob | ArrayBufferView> = [];

  constructor(
    readonly url: string,
    private readonly options: {
      onSend?: (
        data: string | ArrayBufferLike | Blob | ArrayBufferView,
        socket: FakeWebSocket,
      ) => void;
    } = {},
  ) {
    queueMicrotask(() => {
      this.readyState = 1;
      this.onopen?.(new Event("open"));
    });
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    this.options.onSend?.(data, this);
    this.sent.push(data);
  }

  close(): void {
    this.closeWithEvent(1000, "");
  }

  closeWithEvent(code: number, reason: string): void {
    this.readyState = 3;
    this.onclose?.({
      code,
      reason,
      wasClean: code === 1000,
    } as CloseEvent);
  }
}
