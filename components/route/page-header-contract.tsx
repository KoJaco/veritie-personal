"use client";

import { useEffect, useLayoutEffect } from "react";

import { useAppShellPageHeader } from "@/components/static/AppShellPageHeaderProvider";
import type { IndexSearchCommandItem } from "./IndexSearchCommand";

export function usePageHeaderContract() {
    const { contract } = useAppShellPageHeader();
    return contract;
}

export function PageHeaderContractHydrator({
    canOpenAssistant,
    searchItems,
}: {
    canOpenAssistant: boolean;
    searchItems: IndexSearchCommandItem[];
}) {
    const { hydrateContract } = useAppShellPageHeader();

    useEffect(() => {
        hydrateContract({
            canOpenAssistant,
            searchItems,
            suggestionsReady: true,
        });
    }, [canOpenAssistant, hydrateContract, searchItems]);

    return null;
}

export function PageHeaderContractReset({ resetKey }: { resetKey: string }) {
    const { resetContract } = useAppShellPageHeader();

    useLayoutEffect(() => {
        resetContract();
    }, [resetContract, resetKey]);

    return null;
}
