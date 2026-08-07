import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OfflineGate } from "@/components/system/OfflineGate";
import { ServiceWorkerRegistration } from "@/components/system/ServiceWorkerRegistration";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import {
    PWA_DESCRIPTION,
    PWA_THEME_COLOR,
} from "@/lib/pwa/brand-colors";

export const metadata: Metadata = {
    applicationName: "Veritie",
    title: "Veritie",
    description: PWA_DESCRIPTION,
    appleWebApp: {
        capable: true,
        title: "Veritie",
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: PWA_THEME_COLOR },
        { media: "(prefers-color-scheme: dark)", color: PWA_THEME_COLOR },
    ],
    colorScheme: "light dark",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased">
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <OfflineGate>
                        {children}
                    </OfflineGate>
                    <ServiceWorkerRegistration />
                    <Toaster richColors closeButton />
                </ThemeProvider>
            </body>
        </html>
    );
}
