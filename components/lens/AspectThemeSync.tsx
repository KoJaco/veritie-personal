"use client";

import { Suspense, useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";

import { ENABLE_ASPECT_COLORS } from "@/lib/aspect-lens/constants";
import { getAspectLensFromSearchParams } from "@/lib/aspect-lens";
import type { AspectId } from "@/lib/domain/aspect";

function applyAspectTheme(aspect: AspectId) {
    const root = document.documentElement;
    if (!ENABLE_ASPECT_COLORS || aspect === "all") {
        root.removeAttribute("data-aspect");
        return;
    }
    root.setAttribute("data-aspect", aspect);
}

function AspectThemeSyncInner() {
    const searchParams = useSearchParams();
    const lens = getAspectLensFromSearchParams(searchParams);

    useLayoutEffect(() => {
        applyAspectTheme(lens.aspect);
    }, [lens.aspect]);

    return null;
}

export function AspectThemeSync() {
    return (
        <Suspense fallback={null}>
            <AspectThemeSyncInner />
        </Suspense>
    );
}
