/**
 * Work segment 404 page
 *
 * Rendered when a work route is not found.
 */

"use client";

import { LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/system/error-state";

export default function WorkNotFound() {
    const router = useRouter();

    return (
        <ErrorState
            title="Work page not found"
            message="The work page you're looking for doesn't exist or has been moved."
            action={{
                label: "Go to work",
                onClick: () => router.push("/timeline"),
                icon: LayoutDashboard,
            }}
        />
    );
}
