import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Spline_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// Original sentient font - commented out for easy swap back
// const sentient = localFont({
//     src: [
//         {
//             path: "../public/fonts/sentient/Sentient-Regular.woff2",
//             weight: "400",
//             style: "normal",
//         },
//         {
//             path: "../public/fonts/sentient/Sentient-Bold.woff2",
//             weight: "700",
//             style: "normal",
//         },
//     ],
//     variable: "--font-sentient",
//     display: "swap",
// });

// New Spline Sans font
const splineSans = Spline_Sans({
    variable: "--font-spline-sans",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    display: "swap",
});

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
            <body
                className={`${splineSans.variable} ${inter.variable} antialiased`}
            >
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    {children}
                    <Toaster richColors closeButton />
                </ThemeProvider>
            </body>
        </html>
    );
}
