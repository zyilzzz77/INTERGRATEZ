import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: "https", hostname: "is1-ssl.mzstatic.com" },
      { protocol: "https", hostname: "i1.sndcdn.com" },
      { protocol: "https", hostname: "a1.sndcdn.com" },
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "mosaic.scdn.co" },
      { protocol: "https", hostname: "scontent.cdninstagram.com" }, // Common IG CDN
      { protocol: "https", hostname: "scontent-iad3-1.cdninstagram.com" }, // Specific IG CDN seen often
    ],
    localPatterns: [
      {
        pathname: '/**',
      },
      {
        pathname: '/api/proxy-image',
        search: '?url=*',
      },
    ],
  },
};

export default nextConfig;
