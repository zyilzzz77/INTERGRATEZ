import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inversave.space";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",      // API routes
        "/_next/",    // Next.js build files
        "/*?q=*",     // Internal search queries
        "/*&q=*",     // Internal search queries
        "/private/",  // Private dir
        "/profile",   // User-specific
        "/topup/history", // User-specific
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
