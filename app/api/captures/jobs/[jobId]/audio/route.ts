import { NextResponse, type NextRequest } from "next/server";

import { requireSessionApiAccess } from "@/lib/api/require-session-api-access";
import { requireUser } from "@/lib/auth/require-user";
import { buildJobAudioStoragePath } from "@/lib/capture/capture-audio-paths";
import { envServer } from "@/lib/config/env.server";
import { requireAccountScope } from "@/lib/db/repositories/context";
import { assertVeritieJobOwnedByAccount } from "@/lib/db/repositories/veritie-job-leases";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ jobId: string }> },
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

    const { jobId } = await context.params;
    const scope = await requireAccountScope();

    try {
        await assertVeritieJobOwnedByAccount(scope, jobId);
    } catch {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const audio = formData.get("audio");
    if (!(audio instanceof Blob) || audio.size === 0) {
        return NextResponse.json({ error: "Missing audio payload" }, { status: 400 });
    }

    const storagePath = buildJobAudioStoragePath(
        scope.accountId,
        scope.userId,
        jobId,
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

    return NextResponse.json({ ok: true, path: storagePath });
}
