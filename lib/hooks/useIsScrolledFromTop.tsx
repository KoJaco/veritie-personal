import { useState, useEffect, useCallback } from "react";

export function useIsScrolledFromTop(threshold = 0) {
    const [isScrolled, setIsScrolled] = useState(false);

    const handleScroll = useCallback(() => {
        const scrollY =
            window.scrollY !== undefined ? window.scrollY : window.pageYOffset;
        const scrolledFromTop = scrollY > threshold;

        if (scrolledFromTop !== isScrolled) {
            setIsScrolled(scrolledFromTop);
        }
    }, [isScrolled, threshold]);

    useEffect(() => {
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [handleScroll]);

    return isScrolled;
}
