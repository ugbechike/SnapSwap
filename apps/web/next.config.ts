import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@snap-swap/shared", "@snap-swap/ui"]
};

export default nextConfig;
