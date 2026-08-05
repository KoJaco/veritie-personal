import "server-only";

import { redirect } from "next/navigation";

import { DeletedAccountError, UnauthorizedError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/require-user";

export async function ensureActiveSessionOrRedirect(): Promise<void> {
    try {
        await requireUser();
    } catch (error) {
        if (error instanceof DeletedAccountError) {
            redirect("/auth/logout");
        }
        if (error instanceof UnauthorizedError) {
            redirect("/auth/login");
        }
        throw error;
    }
}
