import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import type { RailContextPayload } from "@/components/context/types";
import { PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import type {
    CheckDetailReadModel,
    CheckScope,
} from "@/lib/data-source";
import { checkScopeLabel } from "@/lib/data-source";
import { type ScopeLens } from "@/lib/lens";
import { Badge } from "@/components/ui/badge";
import {
    CheckReadinessBadge,
    CheckReadinessSummary,
    CheckRelatedAttachmentsSection,
    CheckRelatedTasksSection,
} from "./CheckInspection";

type ScopeCheckDetailPageProps = {
    title: string;
    lens: ScopeLens;
    check: CheckDetailReadModel;
    payload: RailContextPayload | null;
    checkScope: CheckScope;
};

export function ScopeCheckDetailPage({
    title,
    lens,
    check,
    payload,
    checkScope,
}: ScopeCheckDetailPageProps) {
    return (
        <>
            <ContextPayloadSlot payload={payload} />
            <PageFrame
                header={
                    <PageHeader
                        title={title}
                        description={check.description}
                        separator={false}
                        metadata={
                            <>
                                <CheckReadinessBadge
                                    readiness={check.readiness}
                                />
                                <Badge variant="outline">
                                    {checkScopeLabel(checkScope)}
                                </Badge>
                                <Badge variant="secondary">
                                    Owner: {check.ownerName}
                                </Badge>
                                <Badge variant="secondary">
                                    v{check.version}
                                </Badge>
                            </>
                        }
                    />
                }
            >
                <div className="space-y-12 py-4">
                    <CheckReadinessSummary check={check} />
                    <CheckRelatedAttachmentsSection
                        items={check.relatedAttachments}
                        lens={lens}
                    />
                    <CheckRelatedTasksSection
                        items={check.relatedTasks}
                        lens={lens}
                    />
                </div>
            </PageFrame>
        </>
    );
}
