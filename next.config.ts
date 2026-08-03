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
};

export default nextConfig;
