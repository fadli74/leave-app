import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/leave-app',
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
