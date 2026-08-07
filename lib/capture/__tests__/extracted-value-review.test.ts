import { extractedValueReviewRequestSchema } from "@/lib/capture/extracted-value-review-schema";
import {
    isValidReviewTransition,
} from "@/lib/capture/extracted-value-review-transitions";

describe("extracted value review", () => {
    describe("extractedValueReviewRequestSchema", () => {
        it("accepts confirm, reject, and rollback targets", () => {
            expect(
                extractedValueReviewRequestSchema.safeParse({
                    extractedValueId: "extracted_task_1",
                    reviewState: "confirmed",
                }).success,
            ).toBe(true);
            expect(
                extractedValueReviewRequestSchema.safeParse({
                    extractedValueId: "extracted_task_1",
                    reviewState: "rejected",
                }).success,
            ).toBe(true);
            expect(
                extractedValueReviewRequestSchema.safeParse({
                    extractedValueId: "extracted_task_1",
                    reviewState: "pending",
                }).success,
            ).toBe(true);
        });
    });

    describe("isValidReviewTransition", () => {
        it("allows confirm and reject from pending", () => {
            expect(isValidReviewTransition("pending", "confirmed")).toBe(true);
            expect(isValidReviewTransition("pending", "rejected")).toBe(true);
        });

        it("allows rollback to pending from terminal states", () => {
            expect(isValidReviewTransition("confirmed", "pending")).toBe(true);
            expect(isValidReviewTransition("rejected", "pending")).toBe(true);
        });

        it("blocks rollback from edited and invalid transitions", () => {
            expect(isValidReviewTransition("edited", "pending")).toBe(false);
            expect(isValidReviewTransition("confirmed", "rejected")).toBe(false);
            expect(isValidReviewTransition("pending", "pending")).toBe(false);
        });
    });
});
