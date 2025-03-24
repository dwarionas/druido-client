import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            { source: "/login/:path*", destination: "/login/:path*" },
            { source: "/app/:path*", destination: "/app/:path*" },
        ];
    },
};

export default nextConfig;
