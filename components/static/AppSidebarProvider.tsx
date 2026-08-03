"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface AppSidebarContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    toggle: () => void;
}

const AppSidebarContext = createContext<AppSidebarContextType | undefined>(
    undefined
);

export function useAppSidebar() {
    const context = useContext(AppSidebarContext);
    if (!context) {
        throw new Error("useAppSidebar must be used within AppSidebarProvider");
    }
    return context;
}

interface AppSidebarProviderProps {
    children: ReactNode;
}

export function AppSidebarProvider({ children }: AppSidebarProviderProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <AppSidebarContext.Provider
            value={{
                isOpen,
                setIsOpen,
                toggle: () => setIsOpen(!isOpen),
            }}
        >
            {children}
        </AppSidebarContext.Provider>
    );
}
