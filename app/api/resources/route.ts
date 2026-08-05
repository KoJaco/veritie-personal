import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getDataSourceAdapters } from "@/lib/data-source";
import { createResourceInputSchema } from "@/lib/resources/create-resource-schema";

export async function POST(request: Request) {
    try {
        await requireUser();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let parsedBody: unknown;
    try {
        parsedBody = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createResourceInputSchema.safeParse(parsedBody);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid request body", details: parsed.error.flatten() },
            { status: 400 },
        );
    }

    const result = await getDataSourceAdapters().resources.createResource(parsed.data);
    return NextResponse.json(result, { status: 201 });
}
