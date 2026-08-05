import "server-only";

import { eq } from "drizzle-orm";

import { veritieJobLeases } from "@/db/schema/capture";
import { getDb } from "@/lib/db";

import type { AccountScope } from "./context";

export type VeritieJobLeaseRow = {
    jobId: string;
    accountId: string;
    userId: string;
    createdAt: Date;
};

export class VeritieJobAccessError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "VeritieJobAccessError";
    }
}

export async function findVeritieJobLease(jobId: string): Promise<VeritieJobLeaseRow | null> {
    const db = getDb();
    const row = await db.query.veritieJobLeases.findFirst({
        where: eq(veritieJobLeases.jobId, jobId),
    });

    return row ?? null;
}

export async function registerVeritieJobLease(
    scope: AccountScope,
    jobId: string,
): Promise<void> {
    const db = getDb();
    const existing = await findVeritieJobLease(jobId);

    if (existing) {
        if (existing.accountId !== scope.accountId) {
            throw new VeritieJobAccessError("Veritie job is registered to another account");
        }
        return;
    }

    await db.insert(veritieJobLeases).values({
        jobId,
        accountId: scope.accountId,
        userId: scope.userId,
        createdAt: new Date(),
    });
}

export async function assertVeritieJobOwnedByAccount(
    scope: AccountScope,
    jobId: string,
): Promise<void> {
    const lease = await findVeritieJobLease(jobId);

    if (!lease) {
        throw new VeritieJobAccessError("Veritie job is not registered for this account");
    }

    if (lease.accountId !== scope.accountId) {
        throw new VeritieJobAccessError("Veritie job belongs to another account");
    }
}

export async function assertVeritieJobProxyReadAllowed(
    scope: AccountScope,
    jobId: string,
): Promise<void> {
    const lease = await findVeritieJobLease(jobId);

    if (lease && lease.accountId !== scope.accountId) {
        throw new VeritieJobAccessError("Veritie job belongs to another account");
    }
}

export function isVeritieJobAccessError(error: unknown): boolean {
    return (
        error instanceof VeritieJobAccessError ||
        (error instanceof Error && error.name === "VeritieJobAccessError")
    );
}
