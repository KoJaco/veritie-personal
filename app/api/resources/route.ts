import { NextResponse } from "next/server";
import { getDataSourceAdapters } from "@/lib/data-source";
import type { CreateResourceInput } from "@/lib/data-source";

export async function POST(request: Request) {
    const input = (await request.json()) as CreateResourceInput;

    if (!input.name?.trim()) {
        return NextResponse.json(
            { error: "Resource name is required." },
            { status: 400 },
        );
    }

    if (!input.ownerName?.trim()) {
        return NextResponse.json(
            { error: "Resource owner is required." },
            { status: 400 },
        );
    }

    const result = getDataSourceAdapters().resources.createResource(input);
    return NextResponse.json(result, { status: 201 });
}
