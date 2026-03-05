import { MetadataRoute } from "next";
import { getAllPlatforms } from "@/lib/platformDetector";
import { i18n } from "../i18n.config";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inversave.space";
    const platforms = getAllPlatforms();

    // Core routes for each language
    const coreRoutes = [
        "", // home
        "/dramabox",
        "/dramabox/foryou",
        "/dramabox/trending",
        "/dramabox/dubbed",
        "/dramabox/vip",
        "/dramawave",
        "/netshort",
        "/melolo",
        "/stardusttv",
        "/search",
        "/about",
        "/bantuan",
        "/blog",
        "/disclaimer",
        "/docs",
        "/privasi",
        "/syarat",
        "/topup",
    ];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // Add core routes
    coreRoutes.forEach((route) => {
        i18n.locales.forEach((locale: string) => {
            sitemapEntries.push({
                url: `${baseUrl}/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency: route === "" ? "daily" : "weekly",
                priority: route === "" ? 1.0 : (route.includes("dramabox") ? 0.9 : 0.8),
            });
        });
    });

    // Add search platform routes (e.g. /search/youtube)
    platforms.forEach((platform) => {
        i18n.locales.forEach((locale: string) => {
            sitemapEntries.push({
                url: `${baseUrl}/${locale}/search/${platform.name}`,
                lastModified: new Date(),
                changeFrequency: "weekly",
                priority: 0.8,
            });
        });
    });

    // Add root URL (fallback)
    sitemapEntries.push({
        url: `${baseUrl}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
    });

    return sitemapEntries;
}
