import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
      { protocol: "https", hostname: "scontent.cdninstagram.com" },
      { protocol: "https", hostname: "scontent-iad3-1.cdninstagram.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "*.pinimg.com" },
      { protocol: "https", hostname: "cdn.wapify.workers.dev" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
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

export default withSentryConfig(nextConfig, {
  silent: true,
});
