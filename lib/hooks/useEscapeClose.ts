import { useEffect } from "react";

export function useEscapeClose(enabled: boolean, onClose: () => void) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [enabled, onClose]);
}

export function useInitialFocus(
    enabled: boolean,
    containerRef: React.RefObject<HTMLElement | null>,
) {
    useEffect(() => {
        if (!enabled || !containerRef.current) return;

        const focusable = containerRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        focusable?.focus();
    }, [containerRef, enabled]);
}
