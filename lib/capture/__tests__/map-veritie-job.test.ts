import { mapVeritieJobToCaptureBundle } from "@/lib/capture/map-veritie-job";
import { buildVeritieJobPersistSchema } from "@/lib/capture/captures-persist-schema";

describe("mapVeritieJobToCaptureBundle", () => {
    it("derives capture aspect ids and title from extraction payload", () => {
        const job = buildVeritieJobPersistSchema().parse({
            job_id: "job_aspect_test",
            status: "completed",
            extraction: {
                payload: {
                    capture_summary: "Morning admin and errands",
                    tasks: [
                        {
                            aspect: "work",
                            title: "Email client",
                            source_quote: "email the client",
                        },
                    ],
                    money_entries: [
                        {
                            aspect: "finance",
                            description: "Chemist vitamins",
                            source_quote: "forty two at chemist",
                        },
                    ],
                },
            },
        });

        const bundle = mapVeritieJobToCaptureBundle(job, "capture_test");

        expect(bundle.capture.title).toBe("Morning admin and errands");
        expect(bundle.capture.aspectIds).toEqual(["finance", "work"]);
        expect(bundle.extractedValues).toHaveLength(2);
        expect(bundle.extractedValues[0]?.fields).toMatchObject({
            source_quote: "email the client",
        });
        expect(bundle.extractedValues[1]?.title).toBe("Chemist vitamins");
    });

    it("reads legacy expenses list key as money entries", () => {
        const job = buildVeritieJobPersistSchema().parse({
            job_id: "job_legacy_expenses",
            status: "completed",
            extraction: {
                payload: {
                    expenses: [
                        {
                            aspect: "finance",
                            description: "Coffee",
                            source_quote: "coffee five dollars",
                        },
                    ],
                },
            },
        });

        const bundle = mapVeritieJobToCaptureBundle(job, "capture_legacy");

        expect(bundle.extractedValues).toHaveLength(1);
        expect(bundle.extractedValues[0]?.objectType).toBe("money_entry");
        expect(bundle.capture.aspectIds).toEqual(["finance"]);
    });
});
