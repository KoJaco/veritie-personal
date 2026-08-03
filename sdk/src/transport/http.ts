import { buildAuthHeaders } from "../auth";
import { VeritieSDKError, errorFromResponse } from "../errors";
import type { ErrorResponse, FetchLike, VeritieClientConfig } from "../types";

export interface HttpRequestOptions {
  method: string;
  path: string;
  pipelineAlias?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  json?: unknown;
  signal?: AbortSignal;
}

export class HttpTransport {
  readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly config: VeritieClientConfig;

  constructor(config: VeritieClientConfig) {
    if (!config.baseUrl.trim()) {
      throw new VeritieSDKError({
        code: "invalid_base_url",
        message: "baseUrl is required",
      });
    }

    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = config.fetch ?? fetch;
    this.config = config;
  }

  async request<T>(options: HttpRequestOptions): Promise<T> {
    const headers = await buildAuthHeaders(this.config, {
      headers: options.headers,
      pipelineAlias: options.pipelineAlias,
    });
    let body = options.body ?? null;

    if (options.json !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.json);
    }

    const response = await this.fetchImpl(`${this.baseUrl}${options.path}`, {
      method: options.method,
      headers,
      body,
      signal: options.signal,
    });

    if (!response.ok) {
      throw await this.parseError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async upload(url: string, body: BodyInit, options?: { headers?: HeadersInit; signal?: AbortSignal }): Promise<void> {
    const response = await this.fetchImpl(url, {
      method: "PUT",
      headers: options?.headers,
      body,
      signal: options?.signal,
    });

    if (!response.ok) {
      throw await this.parseError(response);
    }
  }

  private async parseError(response: Response): Promise<VeritieSDKError> {
    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as Partial<ErrorResponse>;
      return errorFromResponse(response.status, payload);
    }

    const text = await response.text().catch(() => "");
    return errorFromResponse(response.status, undefined, text || undefined);
  }
}
