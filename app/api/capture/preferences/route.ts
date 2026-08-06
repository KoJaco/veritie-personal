import { NextResponse } from "next/server";

import { requireSessionApiAccess } from "@/lib/api/require-session-api-access";
import { requireUser } from "@/lib/auth/require-user";

export async function GET() {
    const denied = await requireSessionApiAccess();
    if (denied) {
        return denied;
    }

    const user = await requireUser();

    return NextResponse.json({
        saveVoiceLogAudio: user.appConfig.saveVoiceLogAudio ?? false,
    });
}
