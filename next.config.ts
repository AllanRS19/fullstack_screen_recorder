import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "ars-snapcast.b-cdn.net",
        protocol: 'https',
        port: '',
        pathname: '/**'
      },
      {
        hostname: "lh3.googleusercontent.com",
        protocol: 'https',
        port: '',
        pathname: '/**'
      }
    ]
  }
};

export default nextConfig;
