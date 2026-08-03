/** Shared z-index layering tokens for overlays, panels, and global chrome. */

export const LAYER_Z_INDEX = {
    launcherBackdrop: 80,
    launcherChrome: 85,
    detailBackdrop: 90,
    detailPanel: 100,
} as const;

export function layerClass(zIndex: number): string {
    return `z-[${zIndex}]`;
}
