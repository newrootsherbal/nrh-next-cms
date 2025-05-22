import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'pub-a31e3f1a87d144898aeb489a8221f92e.r2.dev',
      process.env.NEXT_PUBLIC_URL as string
    ].filter(Boolean),
  },
};

export default nextConfig;
