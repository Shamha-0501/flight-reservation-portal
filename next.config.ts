import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ['lvh.me', '*.lvh.me', 'localhost', '*.localhost'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.duffel.com",
      },
    ],
  },
};

export default nextConfig;
