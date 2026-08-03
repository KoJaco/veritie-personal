import Link from "next/link";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { ObjectSupportingAttachmentsSection } from "@/components/attachments/ObjectSupportingAttachmentsSection";
import { Badge } from "@/components/ui/badge";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import type { AttachmentDetailReadModel } from "@/lib/data-source";
import type { SearchParamRecord } from "@/lib/lens";
import { getScopeLabel, getLensFromSearchParams, withLens, type ScopeKey } from "@/lib/lens";

type DocumentDetailContentProps = {
    document: {
        id: string;
        objectType: string;
        purpose?: string;
        summary?: string;
        scopeIds?: ScopeKey[];
        version: number;
        relatedTaskId?: string;
    };
    markdownContent: string;
    supportingAttachments: AttachmentDetailReadModel[];
    searchParams: SearchParamRecord;
};

export function DocumentDetailContent({
    document,
    markdownContent,
    supportingAttachments,
    searchParams,
}: DocumentDetailContentProps) {
    const lens = getLensFromSearchParams(searchParams);

    return (
        <div className="space-y-12 py-4">
            <section className="space-y-4">
                <h2 className="text-base font-semibold">Overview</h2>

                <div className={cn(SURFACE_CLASS, "space-y-4 p-4")}>
                    {document.purpose ? (
                        <div className="text-sm text-muted-foreground">
                            <h3 className="font-medium text-foreground">
                                Purpose
                            </h3>
                            <p className="text-muted-foreground">
                                {document.purpose}
                            </p>
                        </div>
                    ) : null}

                    {document.summary ? (
                        <div className="text-sm text-muted-foreground">
                            <h3 className="font-medium text-foreground">
                                Summary
                            </h3>
                            <p className="text-muted-foreground">
                                {document.summary}
                            </p>
                        </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-1">
                        {(document.scopeIds ?? []).map((scopeId) => (
                            <Badge key={`${document.id}-${scopeId}`} variant="outline">
                                {getScopeLabel(scopeId)}
                            </Badge>
                        ))}
                        {(document.scopeIds ?? []).length > 0 && (
                            <div className="mx-3 flex items-center justify-center">
                                <span className="h-1 w-1 rounded-full bg-foreground/50" />
                            </div>
                        )}
                        <Badge variant="secondary">{document.objectType}</Badge>
                        <Badge variant="secondary">v{document.version}</Badge>
                        {document.relatedTaskId ? (
                            <Badge variant="outline" asChild>
                                <Link
                                    href={withLens("/work/tasks", lens, {
                                        relatedTaskId: document.relatedTaskId,
                                    })}
                                >
                                    Related tasks
                                </Link>
                            </Badge>
                        ) : null}
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-base font-semibold">Document Content</h2>

                <div className={cn(SURFACE_CLASS, "p-4")}>
                    <MarkdownRenderer content={markdownContent} variant="artifact" />
                </div>
            </section>

            <ObjectSupportingAttachmentsSection
                lens={lens}
                items={supportingAttachments.map((item) => ({
                    id: item.id,
                    title: item.title,
                    kind: item.kind,
                    currentVersionNumber: item.currentVersion.versionNumber,
                    validUntil: item.currentVersion.validUntil,
                }))}
            />
        </div>
    );
}
