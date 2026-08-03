import type { CreateResourceInput, CreateResourceResult } from "@/lib/data-source";

export async function createResourceViaApi(
    input: CreateResourceInput,
): Promise<CreateResourceResult> {
    const response = await fetch("/api/resources", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        throw new Error("Resource create failed");
    }

    return (await response.json()) as CreateResourceResult;
}
