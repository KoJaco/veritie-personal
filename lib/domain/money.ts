import type { AspectKey } from "./aspect";

export type MoneyEntryType =
    | "expense"
    | "income"
    | "bill"
    | "subscription"
    | "reimbursement";

export type MoneyEntryStatus = "candidate" | "confirmed" | "ignored";

export interface MoneyEntry {
    id: string;
    type: MoneyEntryType;
    amount: number;
    currency: string;
    occurredAt?: string;
    dueAt?: string;
    merchantOrPayee?: string;
    category?: string;
    aspect: AspectKey;
    paymentMethod?: string;
    reimbursable?: boolean;
    status: MoneyEntryStatus;
    sourceCaptureIds: string[];
    sourceValueIds: string[];
    createdAt: string;
    updatedAt: string;
}
