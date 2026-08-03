/**
 * Global error boundary
 *
 * Catches errors in the root layout and pages.
 * Client component for handling runtime errors.
 */

"use client";

import { useEffect } from "react";
import { RotateCw, RefreshCw } from "lucide-react";
import { ErrorState } from "@/components/system/error-state";
import { normalizeError } from "@/lib/errors/normalize";
import { isRecoverableError } from "@/lib/errors/is-recoverable";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    const isDevelopment = process.env.NODE_ENV === "development";
    const normalized = normalizeError(error, isDevelopment);
    const recoverable = isRecoverableError(error);

    // Dev log error only
    useEffect(() => {
        if (isDevelopment) {
            console.error("Global error boundary caught:", error);
        }
    }, [error, isDevelopment]);

    return (
        <ErrorState
            title="Something went wrong"
            message={
                recoverable
                    ? "We encountered a temporary issue. Please try again."
                    : "An unexpected error occurred. Please refresh the page or contact support if the problem persists."
            }
            action={
                recoverable
                    ? {
                          label: "Try again",
                          onClick: reset,
                          icon: RotateCw,
                      }
                    : {
                          label: "Reload page",
                          onClick: () => {
                              window.location.reload();
                          },
                          icon: RefreshCw,
                      }
            }
            details={
                isDevelopment
                    ? JSON.stringify(
                          {
                              name: normalized.name,
                              message: normalized.message,
                              code: normalized.code,
                              stack: normalized.stack,
                              digest: error.digest,
                          },
                          null,
                          2
                      )
                    : undefined
            }
        />
    );
}
