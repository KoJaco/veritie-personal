import { NextResponse } from "next/server";

import {
    BoundedBodyError,
    boundedBodyErrorResponse,
    readBoundedJson,
} from "@/lib/api/read-bounded-body";
import { DEFAULT_JSON_API_MAX_BODY_BYTES } from "@/lib/api/body-limits";
import { requireUser } from "@/lib/auth/require-user";
import { getDataSourceAdapters } from "@/lib/data-source";
import { createResourceInputSchema } from "@/lib/resources/create-resource-schema";

export async function POST(request: Request) {
    try {
        await requireUser();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const parsedBody = await readBoundedJson(
            request,
            DEFAULT_JSON_API_MAX_BODY_BYTES,
        );
        const parsed = createResourceInputSchema.safeParse(parsedBody);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const result = await getDataSourceAdapters().resources.createResource(
            parsed.data,
        );
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        if (error instanceof BoundedBodyError) {
            return boundedBodyErrorResponse(error);
        }
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
}
