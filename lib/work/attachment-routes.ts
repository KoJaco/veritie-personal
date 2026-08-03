import { getNormalizedAttachmentSeed } from "@/lib/data-source/stub-normalized-stories";
import { withLens, type ScopeLens } from "@/lib/lens";

export function buildAttachmentContextHref(
    attachmentId: string,
    lens: ScopeLens,
    fallbackHref = "/work/tasks",
): string {
    const seed = getNormalizedAttachmentSeed(attachmentId);
    const taskId = seed?.attachedTaskIds[0];

    if (taskId) {
        return withLens(`/work/tasks/${taskId}`, lens);
    }

    return withLens(fallbackHref, lens);
}
