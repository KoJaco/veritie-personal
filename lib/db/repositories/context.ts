import "server-only";

import { requireUser } from "@/lib/auth/require-user";

export interface AccountScope {
    accountId: string;
    userId: string;
}

export async function requireAccountScope(): Promise<AccountScope> {
    const user = await requireUser();
    return {
        accountId: user.accountId,
        userId: user.id,
    };
}
