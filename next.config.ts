import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async redirects() {
        return [
            { source: "/work", destination: "/timeline", permanent: false },
            {
                source: "/work/tasks/:path*",
                destination: "/tasks/:path*",
                permanent: false,
            },
            {
                source: "/work/documents/:path*",
                destination: "/records/:path*",
                permanent: false,
            },
            {
                source: "/work/resources/:path*",
                destination: "/resources/:path*",
                permanent: false,
            },
            {
                source: "/work/settings/:path*",
                destination: "/settings/:path*",
                permanent: false,
            },
            {
                source: "/work/scopes/:path*",
                destination: "/timeline",
                permanent: false,
            },
            {
                source: "/work/connections/:path*",
                destination: "/settings",
                permanent: false,
            },
        ];
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                ],
            },
            {
                source: "/sw.js",
                headers: [
                    {
                        key: "Content-Type",
                        value: "application/javascript; charset=utf-8",
                    },
                    {
                        key: "Cache-Control",
                        value: "no-cache, no-store, must-revalidate",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: "default-src 'self'; script-src 'self'",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
