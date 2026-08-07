import {
    applyAttributesToExtractionPayload,
    applyIndexQuoteUpdates,
    collectIndexQuoteUpdates,
    deriveExtractedValueFromCandidate,
} from "@/lib/capture/update-extracted-value-artifacts";

describe("update-extracted-value-artifacts", () => {
    it("merges attributes into extraction payload", () => {
        const payload = {
            reminders: [
                {
                    title: "old title",
                    aspect: "admin",
                },
            ],
        };

        const next = applyAttributesToExtractionPayload(
            payload,
            "reminders",
            0,
            { title: "two hours before appointment", remind_at: "2026-08-14T08:00:00+10:00" },
        );

        expect(next.reminders).toEqual([
            {
                title: "two hours before appointment",
                aspect: "admin",
                remind_at: "2026-08-14T08:00:00+10:00",
            },
        ]);
    });

    it("derives extracted value columns from candidate", () => {
        const derived = deriveExtractedValueFromCandidate("reminders", {
            title: "Reminder",
            aspect: "personal",
            remind_at: "2026-08-14T08:00:00+10:00",
            source_quote: "remind me two hours before",
        });

        expect(derived.title).toBe("Reminder");
        expect(derived.aspect).toBe("personal");
        expect(derived.fields.remind_at).toBe("2026-08-14T08:00:00+10:00");
        expect(derived.fields.source_quote).toBe("remind me two hours before");
    });

    it("updates index artifact quotes for source fields", () => {
        const updates = collectIndexQuoteUpdates("reminders", 0, {
            source_quote: "corrected quote",
        });

        const next = applyIndexQuoteUpdates(
            {
                entries: [
                    { path: "/reminders/0/source_quote", quote: "old", status: "matched" },
                ],
            },
            updates,
        );

        const entries = next?.entries as
            | Array<Record<string, unknown>>
            | undefined;
        expect(entries?.[0]).toMatchObject({
            path: "/reminders/0/source_quote",
            quote: "corrected quote",
        });
    });
});
