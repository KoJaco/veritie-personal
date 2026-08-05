import { NextRequest, NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/require-user";
import { requireAccountScope } from "@/lib/db/repositories/context";
import {
    assertVeritieJobProxyReadAllowed,
    isVeritieJobAccessError,
} from "@/lib/db/repositories/veritie-job-leases";
import { assertVeritieProxyAccess } from "@/lib/veritie/proxy-access";
import {
    extractForwardableClientHeaders,
    getVeritieProxyConfig,
    isAllowedVeritieProxyPath,
    proxyVeritieRequest,
    VERITIE_PROXY_MAX_BODY_BYTES,
    type VeritieProxyMethod,
} from "@/lib/veritie/proxy-request";
import {
    injectVeritieJobMetadata,
    registerVeritieJobLeaseFromProxyResponse,
} from "@/lib/veritie/register-job-lease";
import { logger } from "@/lib/logging/server-logger";

type RouteContext = {
    params: Promise<{ path: string[] }>;
};

async function handleVeritieProxy(
    request: NextRequest,
    context: RouteContext,
    method: VeritieProxyMethod,
) {
    try {
        try {
            await requireUser();
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            throw error;
        }

        const access = assertVeritieProxyAccess(request);
        if (!access.allowed) {
            return NextResponse.json(
                { error: access.message },
                { status: access.status },
            );
        }

        const { path } = await context.params;

        if (!path || path.length === 0) {
            return NextResponse.json({ error: "Missing Veritie path" }, { status: 400 });
        }

        if (!isAllowedVeritieProxyPath(method, path)) {
            return NextResponse.json(
                { error: "Veritie proxy path is not allowed" },
                { status: 403 },
            );
        }

        const scope = await requireAccountScope();

        if (
            method === "GET" &&
            path.length === 2 &&
            path[0] === "jobs"
        ) {
            try {
                await assertVeritieJobProxyReadAllowed(scope, path[1]);
            } catch (error) {
                if (isVeritieJobAccessError(error)) {
                    const message =
                        error instanceof Error ? error.message : "Forbidden";
                    return NextResponse.json({ error: message }, { status: 403 });
                }
                throw error;
            }
        }

        const config = getVeritieProxyConfig();
        let body: string | null = null;

        if (method === "POST") {
            const rawBody = await request.text();
            const bodyBytes = Buffer.byteLength(rawBody, "utf8");
            if (bodyBytes > VERITIE_PROXY_MAX_BODY_BYTES) {
                return NextResponse.json(
                    {
                        error: `Request body exceeds ${VERITIE_PROXY_MAX_BODY_BYTES} bytes`,
                    },
                    { status: 413 },
                );
            }
            body =
                path.length === 1 && path[0] === "jobs"
                    ? injectVeritieJobMetadata(rawBody, scope)
                    : rawBody;
        }

        const upstream = await proxyVeritieRequest({
            method,
            pathSegments: path,
            search: request.nextUrl.search,
            body,
            contentType: request.headers.get("content-type"),
            forwardHeaders: extractForwardableClientHeaders(request.headers),
            signal: request.signal,
        }, config);

        const responseText = await upstream.text();

        if (method === "POST" && path.length === 1 && path[0] === "jobs") {
            await registerVeritieJobLeaseFromProxyResponse(
                scope,
                path,
                upstream.status,
                responseText,
            );
        }

        const responseInit: ResponseInit = {
            status: upstream.status,
            statusText: upstream.statusText,
        };
        const contentType = upstream.headers.get("content-type");
        if (contentType) {
            responseInit.headers = { "content-type": contentType };
        }

        return new NextResponse(responseText, responseInit);
    } catch (error) {
        logger.error("[veritie-proxy] request_failed", {
            error: error instanceof Error ? error : String(error),
        });

        const message =
            error instanceof Error ? error.message : "Veritie proxy request failed";
        const hint =
            message === "fetch failed"
                ? "Could not reach VERITIE_API_URL from the Next.js server. If Veritie runs on the Windows host, try host.docker.internal:3001 instead of localhost:3001."
                : undefined;
        const status = message.includes("required for the Veritie proxy")
            ? 503
            : message === "Veritie proxy path is not allowed"
              ? 403
              : 502;

        return NextResponse.json(
            { error: message, ...(hint ? { hint } : {}) },
            { status },
        );
    }
}

export async function GET(request: NextRequest, context: RouteContext) {
    return handleVeritieProxy(request, context, "GET");
}

export async function POST(request: NextRequest, context: RouteContext) {
    return handleVeritieProxy(request, context, "POST");
}

export async function PUT() {
    return methodNotAllowed();
}

export async function PATCH() {
    return methodNotAllowed();
}

export async function DELETE() {
    return methodNotAllowed();
}

function methodNotAllowed() {
    return NextResponse.json(
        {
            error:
                "Method not allowed on Veritie proxy. Signed upload URLs are called directly.",
        },
        { status: 405 },
    );
}
