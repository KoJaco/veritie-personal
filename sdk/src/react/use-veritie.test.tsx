// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useVeritie } from "./use-veritie";
import { jsonResponse, textStreamResponse } from "../test-helpers";

const APP_ALIAS = "field-service-au";

describe("useVeritie", () => {
  it("exposes create/finalize/get methods through the hook", async () => {
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
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-1",
          status: "queued",
          status_url: "/v1/jobs/job-1",
          stream_url: "/v1/jobs/job-1/stream",
        }),
      )
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-1",
          status: "queued",
          accepted_request: { audio_content_type: "audio/wav" },
          events: [],
        }),
      );

    const { result } = renderHook(() =>
      useVeritie({
        config: {
          baseUrl: "https://api.example.test",
          pipelineAlias: APP_ALIAS,
          fetch: fetchMock as typeof fetch,
        },
      }),
    );

    await act(async () => {
      const bootstrap = await result.current.createJob({ audio_content_type: "audio/wav" });
      expect(bootstrap.status).toBe("awaiting_upload");

      const finalized = await result.current.finalizeUpload("job-1", {
        audio_uri: "supabase://audio/jobs/job-1/source",
      });
      expect(finalized.status).toBe("queued");

      const detail = await result.current.getJob("job-1");
      expect(detail.job_id).toBe("job-1");
    });
  });

  it("tracks stream events and latest snapshot", async () => {
    const fetchMock = vi.fn(async () =>
      textStreamResponse([
        "id: cursor-2\nevent: accepted\ndata: {\"job_id\":\"job-1\",\"timestamp\":\"2026-03-17T00:00:00Z\",\"level\":\"info\",\"progress\":0,\"message\":\"accepted\"}\n\n",
        "event: job.snapshot\ndata: {\"job_id\":\"job-1\",\"status\":\"queued\",\"terminal\":false,\"last_event_id\":\"cursor-2\"}\n\n",
        "id: cursor-3\nevent: completed\ndata: {\"job_id\":\"job-1\",\"timestamp\":\"2026-03-17T00:01:00Z\",\"level\":\"info\",\"progress\":1,\"message\":\"done\"}\n\n",
      ]),
    );

    const { result } = renderHook(() =>
      useVeritie({
        config: {
          baseUrl: "https://api.example.test",
          pipelineAlias: APP_ALIAS,
          fetch: fetchMock as typeof fetch,
        },
      }),
    );

    await act(async () => {
      await result.current.subscribeToJob("job-1");
    });

    await waitFor(() => {
      expect(result.current.events).toHaveLength(3);
      expect(result.current.latestSnapshot?.status).toBe("queued");
    });

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe("disconnected");
    });
  });

  it("keeps hook error clear for handled post-open recoverable disconnects", async () => {
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

    const { result } = renderHook(() =>
      useVeritie({
        config: {
          baseUrl: "https://api.example.test",
          pipelineAlias: APP_ALIAS,
          fetch: fetchMock as typeof fetch,
        },
      }),
    );

    await act(async () => {
      const subscription = await result.current.subscribeToJob("job-1");
      await subscription.completed;
    });

    expect(result.current.error).toBeNull();
    expect(result.current.events).toHaveLength(1);

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe("disconnected");
    });
  });

  it("surfaces genuine stream failures through hook error state", async () => {
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

    const { result } = renderHook(() =>
      useVeritie({
        config: {
          baseUrl: "https://api.example.test",
          pipelineAlias: APP_ALIAS,
          fetch: fetchMock as typeof fetch,
        },
      }),
    );

    await act(async () => {
      const subscription = await result.current.subscribeToJob("job-1");
      await expect(subscription.completed).rejects.toMatchObject({
        code: "stream_read_failed",
      });
    });

    await waitFor(() => {
      expect(result.current.error).toMatchObject({
        code: "stream_read_failed",
      });
      expect(result.current.connectionStatus).toBe("error");
    });
  });

  it("tracks one prepared handle and clears it explicitly", async () => {
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

    const { result } = renderHook(() =>
      useVeritie({
        config: {
          baseUrl: "https://api.example.test",
          pipelineAlias: APP_ALIAS,
          fetch: fetchMock as typeof fetch,
        },
      }),
    );

    await act(async () => {
      await result.current.prepareUpload(
        { audio_content_type: "audio/wav", audio_size_bytes: 5 },
        { transportPolicy: "batch_only" },
      );
    });

    expect(result.current.preparedHandle).not.toBeNull();
    expect(result.current.preparedHandleSnapshot).toMatchObject({
      jobId: "job-prepared-1",
      leaseStatus: "prepared",
      transportPolicy: "batch_only",
    });

    act(() => {
      result.current.clearPreparedHandle();
    });

    expect(result.current.preparedHandle).toBeNull();
    expect(result.current.preparedHandleSnapshot).toBeNull();
  });

  it("closes prepared handle subscriptions when clearing the handle", async () => {
    let subscriptionSignal: AbortSignal | undefined;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-prepared-stream",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-prepared-stream",
          stream_url: "/v1/jobs/job-prepared-stream/stream",
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            audio_uri: "supabase://audio/jobs/job-prepared-stream/source",
          },
        }),
      )
      .mockImplementationOnce(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const signal = init?.signal ?? undefined;
        subscriptionSignal = signal;
        return createAbortablePendingTextStreamResponse(signal);
      });

    const { result } = renderHook(() =>
      useVeritie({
        config: {
          baseUrl: "https://api.example.test",
          pipelineAlias: APP_ALIAS,
          fetch: fetchMock as typeof fetch,
        },
      }),
    );

    let handle!: NonNullable<typeof result.current.preparedHandle>;
    let subscription!: Awaited<ReturnType<NonNullable<typeof result.current.preparedHandle>["stream"]>>;

    await act(async () => {
      handle = await result.current.prepareUpload(
        { audio_content_type: "audio/wav", audio_size_bytes: 5 },
        { transportPolicy: "batch_only" },
      );
      subscription = await handle.stream();
    });

    act(() => {
      result.current.clearPreparedHandle();
    });

    expect(result.current.preparedHandle).toBeNull();
    expect(result.current.preparedHandleSnapshot).toBeNull();
    expect(subscription.closed).toBe(true);
    expect(subscriptionSignal?.aborted).toBe(true);
    expect(handle.snapshot.leaseStatus).toBe("aborted");
  });

  it("resets hook state", async () => {
    const fetchMock = vi.fn(async () =>
      textStreamResponse([
        "event: job.snapshot\ndata: {\"job_id\":\"job-1\",\"status\":\"queued\",\"terminal\":false}\n\n",
      ]),
    );

    const { result } = renderHook(() =>
      useVeritie({
        config: {
          baseUrl: "https://api.example.test",
          pipelineAlias: APP_ALIAS,
          fetch: fetchMock as typeof fetch,
        },
      }),
    );

    await act(async () => {
      await result.current.subscribeToJob("job-1");
    });

    await waitFor(() => {
      expect(result.current.latestSnapshot?.status).toBe("queued");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.events).toHaveLength(0);
    expect(result.current.latestSnapshot).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.connectionStatus).toBe("disconnected");
  });

  it("does not recreate the SDK on rerender when config values are unchanged", async () => {
    const fetchMock = vi.fn(async () =>
      textStreamResponse([
        "event: job.snapshot\ndata: {\"job_id\":\"job-1\",\"status\":\"queued\",\"terminal\":false}\n\n",
      ]),
    );

    const { result, rerender } = renderHook(
      ({ baseUrl, apiKey, pipelineAlias }) =>
        useVeritie({
          config: {
            baseUrl,
            pipelineAlias,
            apiKey,
            fetch: fetchMock as typeof fetch,
          },
        }),
      {
        initialProps: {
          baseUrl: "https://api.example.test",
          pipelineAlias: APP_ALIAS,
          apiKey: "secret",
        },
      },
    );

    await act(async () => {
      await result.current.subscribeToJob("job-1");
    });

    await waitFor(() => {
      expect(result.current.latestSnapshot?.status).toBe("queued");
    });

    rerender({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      apiKey: "secret",
    });

    expect(result.current.latestSnapshot?.status).toBe("queued");
    expect(result.current.connectionStatus).not.toBe("connecting");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps hook method references stable when config values are unchanged", () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));

    const { result, rerender } = renderHook(
      ({ baseUrl, apiKey, pipelineAlias }) =>
        useVeritie({
          config: {
            baseUrl,
            pipelineAlias,
            apiKey,
            fetch: fetchMock as typeof fetch,
          },
        }),
      {
        initialProps: {
          baseUrl: "https://api.example.test",
          pipelineAlias: APP_ALIAS,
          apiKey: "secret",
        },
      },
    );

    const initialPrepareCapture = result.current.prepareCapture;
    const initialPrepareUpload = result.current.prepareUpload;
    const initialClearPreparedHandle = result.current.clearPreparedHandle;

    rerender({
      baseUrl: "https://api.example.test",
      pipelineAlias: APP_ALIAS,
      apiKey: "secret",
    });

    expect(result.current.prepareCapture).toBe(initialPrepareCapture);
    expect(result.current.prepareUpload).toBe(initialPrepareUpload);
    expect(result.current.clearPreparedHandle).toBe(initialClearPreparedHandle);
  });

  it("replaces prepared handles when baseUrl, pipelineAlias, or apiKey change", async () => {
    let createCount = 0;
    const fetchMock = vi.fn(async () => {
      createCount += 1;
      return jsonResponse({
        job_id: `job-prepared-${createCount}`,
        status: "awaiting_upload",
        status_url: `/v1/jobs/job-prepared-${createCount}`,
        stream_url: `/v1/jobs/job-prepared-${createCount}/stream`,
        upload: {
          method: "PUT",
          url: "https://upload.example.test/put",
          audio_uri: `supabase://audio/jobs/job-prepared-${createCount}/source`,
        },
      });
    });

    const { result, rerender } = renderHook(
      ({ baseUrl, pipelineAlias, apiKey }) =>
        useVeritie({
          config: {
            baseUrl,
            pipelineAlias,
            apiKey,
            fetch: fetchMock as typeof fetch,
          },
        }),
      {
        initialProps: {
          baseUrl: "https://api.example.test",
          pipelineAlias: APP_ALIAS,
          apiKey: "secret-1",
        },
      },
    );

    await act(async () => {
      await result.current.prepareUpload(
        { audio_content_type: "audio/wav", audio_size_bytes: 5 },
        { transportPolicy: "batch_only" },
      );
    });
    const firstHandle = result.current.preparedHandle;

    rerender({
      baseUrl: "https://api-alt.example.test",
      pipelineAlias: APP_ALIAS,
      apiKey: "secret-1",
    });

    await waitFor(() => {
      expect(result.current.preparedHandle).toBeNull();
      expect(result.current.preparedHandleSnapshot).toBeNull();
    });
    expect(firstHandle?.snapshot.leaseStatus).toBe("aborted");

    await act(async () => {
      await result.current.prepareUpload(
        { audio_content_type: "audio/wav", audio_size_bytes: 5 },
        { transportPolicy: "batch_only" },
      );
    });
    const secondHandle = result.current.preparedHandle;

    rerender({
      baseUrl: "https://api-alt.example.test",
      pipelineAlias: "field-service-us",
      apiKey: "secret-1",
    });

    await waitFor(() => {
      expect(result.current.preparedHandle).toBeNull();
      expect(result.current.preparedHandleSnapshot).toBeNull();
    });
    expect(secondHandle?.snapshot.leaseStatus).toBe("aborted");

    await act(async () => {
      await result.current.prepareUpload(
        { audio_content_type: "audio/wav", audio_size_bytes: 5 },
        { transportPolicy: "batch_only" },
      );
    });
    const thirdHandle = result.current.preparedHandle;

    rerender({
      baseUrl: "https://api-alt.example.test",
      pipelineAlias: "field-service-us",
      apiKey: "secret-2",
    });

    await waitFor(() => {
      expect(result.current.preparedHandle).toBeNull();
      expect(result.current.preparedHandleSnapshot).toBeNull();
    });
    expect(thirdHandle?.snapshot.leaseStatus).toBe("aborted");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("cleans up prepared handles and subscriptions on unmount", async () => {
    let subscriptionSignal: AbortSignal | undefined;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({
          job_id: "job-unmount",
          status: "awaiting_upload",
          status_url: "/v1/jobs/job-unmount",
          stream_url: "/v1/jobs/job-unmount/stream",
          upload: {
            method: "PUT",
            url: "https://upload.example.test/put",
            audio_uri: "supabase://audio/jobs/job-unmount/source",
          },
        }),
      )
      .mockImplementationOnce(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const signal = init?.signal ?? undefined;
        subscriptionSignal = signal;
        return createAbortablePendingTextStreamResponse(signal);
      });

    const { result, unmount } = renderHook(() =>
      useVeritie({
        config: {
          baseUrl: "https://api.example.test",
          pipelineAlias: APP_ALIAS,
          fetch: fetchMock as typeof fetch,
        },
      }),
    );

    let handle!: NonNullable<typeof result.current.preparedHandle>;
    let subscription!: Awaited<ReturnType<NonNullable<typeof result.current.preparedHandle>["stream"]>>;

    await act(async () => {
      handle = await result.current.prepareUpload(
        { audio_content_type: "audio/wav", audio_size_bytes: 5 },
        { transportPolicy: "batch_only" },
      );
      subscription = await handle.stream();
    });

    unmount();

    expect(subscription.closed).toBe(true);
    expect(subscriptionSignal?.aborted).toBe(true);
    expect(handle.snapshot.leaseStatus).toBe("aborted");
  });
});

function createAbortablePendingTextStreamResponse(signal?: AbortSignal): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      signal?.addEventListener(
        "abort",
        () => controller.error(new DOMException("Aborted", "AbortError")),
        { once: true },
      );
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}
