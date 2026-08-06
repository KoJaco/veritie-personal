import type { accounts, users } from "@/db/schema/identity";

import { DeletedAccountError } from "./errors";

type UserRow = Pick<typeof users.$inferSelect, "deletedAt">;
type AccountRow = Pick<typeof accounts.$inferSelect, "deletedAt">;

export function isUserDeleted(user: UserRow): boolean {
    return user.deletedAt !== null;
}

export function isAccountDeleted(account: AccountRow): boolean {
    return account.deletedAt !== null;
}

export function assertAccountActive(
    user: UserRow,
    account: AccountRow,
): void {
    if (isUserDeleted(user) || isAccountDeleted(account)) {
        throw new DeletedAccountError(
            "This account was previously deleted. Please contact support if you would like to restore your account.",
        );
    }
}
