"use client";

import {
    createContext,
    useContext,
    useLayoutEffect,
    useState,
    type ReactNode,
} from "react";

interface AppShellPageHeaderContextType {
    header: ReactNode | null;
    setHeader: (header: ReactNode | null) => void;
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

    return (
        <AppShellPageHeaderContext.Provider value={{ header, setHeader }}>
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
