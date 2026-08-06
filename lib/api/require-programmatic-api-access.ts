import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/require-user";
import { getDataSourceKind } from "@/lib/data-source/registry";

import { requireInternalStubApiAccess } from "./require-internal-stub-api-access";

/**
 * Auth gate for programmatic mutation/read APIs (scripts, admin).
 * Backend mode: session via `requireUser()`.
 * Stub mode: bearer secret (or dev/test bypass).
 */
export async function requireProgrammaticApiAccess(
    request: NextRequest,
): Promise<NextResponse | null> {
    const kind = getDataSourceKind();

    if (kind === "backend") {
        try {
            await requireUser();
            return null;
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const access = requireInternalStubApiAccess(request);
    if (!access.allowed) {
        return NextResponse.json(
            { error: access.message },
            { status: access.status },
        );
    }

    return null;
}
