import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/require-user";

/**
 * Session auth gate for in-app JSON API routes (chat, attachments upload).
 * Returns 401 JSON on failure; null when the caller may proceed.
 */
export async function requireSessionApiAccess(): Promise<NextResponse | null> {
    try {
        await requireUser();
        return null;
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
