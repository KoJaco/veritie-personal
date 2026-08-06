"use client";

import { Loader2, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function IndexStatusBanner({
  indexStatus,
  indexingState,
  errorClass,
}: {
  indexStatus?: "completed" | "failed" | null;
  indexingState?: string | null;
  errorClass?: string | null;
}) {
  const isIndexing =
    indexingState === "pending" || indexingState === "running";

  if (isIndexing) {
    return (
      <Alert>
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <AlertTitle>Building evidence index</AlertTitle>
        <AlertDescription>
          Extraction is visible now. Transcript links will hydrate when indexing
          completes.
        </AlertDescription>
      </Alert>
    );
  }

  if (indexStatus === "failed") {
    return (
      <Alert variant="default">
        <TriangleAlert className="size-4" aria-hidden="true" />
        <AlertTitle>Evidence index unavailable</AlertTitle>
        <AlertDescription>
          Transcript and extraction are still shown, but source linking could not
          be built
          {errorClass ? ` (${errorClass})` : ""}.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
