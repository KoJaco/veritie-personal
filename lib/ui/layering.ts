/** Shared z-index layering tokens for overlays, panels, and global chrome. */

export const LAYER_Z_INDEX = {
    launcherBackdrop: 80,
    launcherChrome: 85,
    detailBackdrop: 90,
    detailPanel: 100,
} as const;

/** Literal Tailwind classes — dynamic `z-[${n}]` is not emitted by the compiler. */
export const LAYER_CLASS = {
    launcherBackdrop: "z-[80]",
    launcherChrome: "z-[85]",
    detailBackdrop: "z-[90]",
    detailPanel: "z-[100]",
} as const;
