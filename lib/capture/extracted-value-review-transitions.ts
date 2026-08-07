import type { ReviewState } from "@/lib/domain/extraction";

export function isValidReviewTransition(
    currentState: ReviewState,
    nextState: ReviewState,
): boolean {
    if (nextState === "confirmed" || nextState === "rejected") {
        return currentState === "pending";
    }

    if (nextState === "pending") {
        return currentState === "confirmed" || currentState === "rejected";
    }

    return false;
}
