"use client";

import {
    createContext,
    useCallback,
    useContext,
    useLayoutEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import type { IndexSearchCommandItem } from "@/components/route/IndexSearchCommand";

export type PageHeaderContractState = {
    canOpenAssistant: boolean;
    searchItems: IndexSearchCommandItem[];
    suggestionsReady: boolean;
};

const defaultPageHeaderContract: PageHeaderContractState = {
    canOpenAssistant: false,
    searchItems: [],
    suggestionsReady: false,
};

interface AppShellPageHeaderContextType {
    header: ReactNode | null;
    setHeader: (header: ReactNode | null) => void;
    contract: PageHeaderContractState;
    hydrateContract: (state: PageHeaderContractState) => void;
    resetContract: () => void;
}

const AppShellPageHeaderContext = createContext<
    AppShellPageHeaderContextType | undefined
>(undefined);

export function useAppShellPageHeader() {
    const context = useContext(AppShellPageHeaderContext);
    if (!context) {
        throw new Error(
            "useAppShellPageHeader must be used within AppShellPageHeaderProvider",
        );
    }
    return context;
}

interface AppShellPageHeaderProviderProps {
    children: ReactNode;
}

export function AppShellPageHeaderProvider({
    children,
}: AppShellPageHeaderProviderProps) {
    const [header, setHeader] = useState<ReactNode | null>(null);
    const [contract, setContract] = useState<PageHeaderContractState>(
        defaultPageHeaderContract,
    );

    const hydrateContract = useCallback((state: PageHeaderContractState) => {
        setContract(state);
    }, []);

    const resetContract = useCallback(() => {
        setContract(defaultPageHeaderContract);
    }, []);

    const value = useMemo(
        () => ({
            header,
            setHeader,
            contract,
            hydrateContract,
            resetContract,
        }),
        [header, contract, hydrateContract, resetContract],
    );

    return (
        <AppShellPageHeaderContext.Provider value={value}>
            {children}
        </AppShellPageHeaderContext.Provider>
    );
}

export function AppShellPageHeaderSlot() {
    const { header } = useAppShellPageHeader();

    const slotClassName = "min-h-[5.5rem] w-full shrink-0";

    if (!header) {
        return <div className={slotClassName} aria-hidden />;
    }

    return <div className={slotClassName}>{header}</div>;
}

interface AppShellPageHeaderProps {
    children: ReactNode;
}

export function AppShellPageHeader({ children }: AppShellPageHeaderProps) {
    const { setHeader } = useAppShellPageHeader();

    useLayoutEffect(() => {
        setHeader(children);
        return () => setHeader(null);
    }, [children, setHeader]);

    return null;
}
