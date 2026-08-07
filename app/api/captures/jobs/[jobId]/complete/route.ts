import { after, NextResponse, type NextRequest } from "next/server";
import { requireSessionApiAccess } from "@/lib/api/require-session-api-access";
import { capturesPersistRequestSchema } from "@/lib/capture/captures-persist-schema";
import { completeCaptureFromVeritieJob } from "@/lib/capture/complete-capture-from-job.server";
import { captureFlowServerLog } from "@/lib/capture/capture-flow-server-logger";

export const maxDuration = 300;

export async function POST(
    _request: NextRequest,
    context: { params: Promise<{ jobId: string }> },
) {
    const denied = await requireSessionApiAccess();
    if (denied) {
        return denied;
    }

    const { jobId } = await context.params;
    const parsed = capturesPersistRequestSchema.safeParse({ jobId });
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
    }

    const validatedJobId = parsed.data.jobId;
    after(async () => {
        try {
            await completeCaptureFromVeritieJob(validatedJobId);
        } catch (error) {
            captureFlowServerLog.error("complete.failed", {
                jobId: validatedJobId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });

    return NextResponse.json({ ok: true }, { status: 202 });
}
