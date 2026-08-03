/**
 * Global 404 page
 *
 * Rendered when a route is not found.
 */

"use client";

import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/system/error-state";

export default function NotFound() {
    const router = useRouter();

    return (
        <ErrorState
            title="Page not found"
            message="The page you're looking for doesn't exist or has been moved."
            action={{
                label: "Go home",
                onClick: () => router.push("/"),
                icon: Home,
            }}
        />
    );
}
