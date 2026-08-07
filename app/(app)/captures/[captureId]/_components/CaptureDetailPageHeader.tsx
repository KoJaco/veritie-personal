"use client";

import { PageHeader, usePageHeaderContract } from "@/components/route";

export function CaptureDetailPageHeader() {
    const { headerTitle, headerDescription } = usePageHeaderContract();

    return (
        <PageHeader
            title={headerTitle ?? "Capture"}
            description={headerDescription ?? "Voice log or uploaded source."}
            separator={false}
        />
    );
}
