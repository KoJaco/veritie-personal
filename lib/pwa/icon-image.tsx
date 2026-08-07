import {
    PWA_BACKGROUND_COLOR,
    PWA_THEME_COLOR,
} from "@/lib/pwa/brand-colors";

export function VeritieIconMark({
    size,
    maskable = false,
}: {
    size: number;
    maskable?: boolean;
}) {
    const padding = maskable ? size * 0.2 : size * 0.15;
    const fontSize = size * 0.48;

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: PWA_BACKGROUND_COLOR,
                padding,
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: maskable ? size * 0.22 : size * 0.18,
                    background: PWA_THEME_COLOR,
                    color: PWA_BACKGROUND_COLOR,
                    fontSize,
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    fontFamily: "ui-sans-serif, system-ui, sans-serif",
                }}
            >
                V
            </div>
        </div>
    );
}
