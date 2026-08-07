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
    headerTitle,
    headerDescription,
    suggestionsReady = true,
}: {
    canOpenAssistant: boolean;
    searchItems: IndexSearchCommandItem[];
    headerTitle?: string;
    headerDescription?: string;
    suggestionsReady?: boolean;
}) {
    const { hydrateContract } = useAppShellPageHeader();

    useEffect(() => {
        hydrateContract({
            canOpenAssistant,
            searchItems,
            suggestionsReady,
            headerTitle,
            headerDescription,
        });
    }, [
        canOpenAssistant,
        headerDescription,
        headerTitle,
        hydrateContract,
        searchItems,
        suggestionsReady,
    ]);

    return null;
}

export function PageHeaderContractReset({ resetKey }: { resetKey: string }) {
    const { resetContract } = useAppShellPageHeader();

    useLayoutEffect(() => {
        resetContract();
    }, [resetContract, resetKey]);

    return null;
}
