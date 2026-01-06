import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // TO LOAD IMAGES FROM EXTERNAL DOMAINS THIS MUST BE ADDED...
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vanturalog.najubudeen.info',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',        // For the Hero Image
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'secure.gravatar.com',
        pathname: '/**',
      },
    ],
  },
  reactCompiler: true,
  devIndicators:false
};

export default nextConfig;
