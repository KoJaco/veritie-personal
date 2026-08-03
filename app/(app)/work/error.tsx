/**
 * Work segment error boundary
 *
 * Catches errors in the work segment and its children.
 * This is a client component that handles runtime errors.
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

export default function WorkError({ error, reset }: ErrorProps) {
    const isDevelopment = process.env.NODE_ENV === "development";
    const normalized = normalizeError(error, isDevelopment);
    const recoverable = isRecoverableError(error);

    // Log error in development
    useEffect(() => {
        if (isDevelopment) {
            console.error("Work error boundary caught:", error);
        }
    }, [error, isDevelopment]);

    return (
        <ErrorState
            title="Work error"
            message={
                recoverable
                    ? "We encountered a temporary issue loading work. Please try again."
                    : "An error occurred in work. Please refresh the page or contact support if the problem persists."
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
