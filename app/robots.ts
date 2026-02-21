import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://inversave.space";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",      // API routes - jangan di-crawl
        "/_next/",    // Next.js build files
        "/*?q=*",     // Internal search queries (mencegah konten duplikat)
        "/*&q=*",     // Internal search queries (parameter kedua)
        "/private/",  // Direktori private (jika ada)
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
