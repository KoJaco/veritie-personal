import { NextResponse, type NextRequest } from "next/server";

import { requireSessionApiAccess } from "@/lib/api/require-session-api-access";
import { requireUser } from "@/lib/auth/require-user";
import { envServer } from "@/lib/config/env.server";
import { getDb } from "@/lib/db";
import { requireAccountScope } from "@/lib/db/repositories/context";
import {
    assertCaptureInAccount,
    updateVoiceLogAudioUri,
} from "@/lib/db/repositories/captures";
import { voiceLogs } from "@/db/schema/capture";
import { and, eq } from "drizzle-orm";
import { createAdminClient } from "@/lib/supabase/admin";

function buildAudioStoragePath(
    accountId: string,
    userId: string,
    captureId: string,
): string {
    return `${accountId}/${userId}/${captureId}.webm`;
}

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ captureId: string }> },
) {
    const denied = await requireSessionApiAccess();
    if (denied) {
        return denied;
    }

    const { captureId } = await context.params;
    const scope = await requireAccountScope();

    try {
        await assertCaptureInAccount(scope, captureId);
    } catch {
        return NextResponse.json({ error: "Capture not found" }, { status: 404 });
    }

    const db = getDb();
    const voiceLog = await db.query.voiceLogs.findFirst({
        where: and(
            eq(voiceLogs.accountId, scope.accountId),
            eq(voiceLogs.captureId, captureId),
        ),
    });

    if (!voiceLog?.audioUri) {
        return NextResponse.json({ error: "Audio not available" }, { status: 404 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.storage
        .from(envServer.supabaseAudioBucket)
        .createSignedUrl(voiceLog.audioUri, 3600);

    if (error || !data?.signedUrl) {
        return NextResponse.json(
            { error: "Could not sign audio URL" },
            { status: 500 },
        );
    }

    return NextResponse.json({ url: data.signedUrl });
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ captureId: string }> },
) {
    const denied = await requireSessionApiAccess();
    if (denied) {
        return denied;
    }

    const user = await requireUser();
    if (!user.appConfig.saveVoiceLogAudio) {
        return NextResponse.json(
            { error: "Voice log audio saving is disabled" },
            { status: 403 },
        );
    }

    const { captureId } = await context.params;
    const scope = await requireAccountScope();

    try {
        await assertCaptureInAccount(scope, captureId);
    } catch {
        return NextResponse.json({ error: "Capture not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const audio = formData.get("audio");
    if (!(audio instanceof Blob) || audio.size === 0) {
        return NextResponse.json({ error: "Missing audio payload" }, { status: 400 });
    }

    const storagePath = buildAudioStoragePath(
        scope.accountId,
        scope.userId,
        captureId,
    );

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
        .from(envServer.supabaseAudioBucket)
        .upload(storagePath, audio, {
            contentType: audio.type || "audio/webm",
            upsert: true,
        });

    if (uploadError) {
        return NextResponse.json(
            { error: uploadError.message },
            { status: 500 },
        );
    }

    await updateVoiceLogAudioUri(scope, captureId, storagePath);

    return NextResponse.json({ ok: true, path: storagePath });
}
