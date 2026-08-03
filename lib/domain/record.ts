import type { AspectKey } from "./aspect";

export type RecordKind =
    | "uploaded_pdf"
    | "uploaded_image"
    | "receipt"
    | "note"
    | "decision"
    | "generated_markdown"
    | "extracted_fact"
    | "document_summary"
    | "bundle";

export interface Record {
    id: string;
    title: string;
    kind: RecordKind;
    aspect: AspectKey;
    markdownContent?: string;
    sourceCaptureIds: string[];
    sourceValueIds: string[];
    relatedTaskIds: string[];
    relatedGoalIds: string[];
    relatedResourceIds: string[];
    relatedMoneyEntryIds: string[];
    occurredAt?: string;
    createdAt: string;
    updatedAt: string;
}
