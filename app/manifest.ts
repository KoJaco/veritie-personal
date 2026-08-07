import type { MetadataRoute } from "next";

import {
    PWA_BACKGROUND_COLOR,
    PWA_DESCRIPTION,
    PWA_THEME_COLOR,
} from "@/lib/pwa/brand-colors";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Veritie",
        short_name: "Veritie",
        description: PWA_DESCRIPTION,
        start_url: "/timeline",
        scope: "/",
        display: "standalone",
        background_color: PWA_BACKGROUND_COLOR,
        theme_color: PWA_THEME_COLOR,
        icons: [
            {
                src: "/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
            {
                src: "/icon-maskable-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
