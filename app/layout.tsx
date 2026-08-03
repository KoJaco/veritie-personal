import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
    title: "Assistant-Scoped Platform Shell",
    description:
        "Task-driven workspace shell with route-scoped assistant context and server-built views.",
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
                    {children}
                    <Toaster richColors closeButton />
                </ThemeProvider>
            </body>
        </html>
    );
}
