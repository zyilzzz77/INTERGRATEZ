import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://inversave.space';

export interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    keywords?: string[];
    type?: 'website' | 'article' | 'video.movie' | 'music.song';
    locale?: string;
    noIndex?: boolean;
}

export const defaultSEO = {
    title: 'Inversave — Situs Download Video Semua Sosmed & Streaming Gratis',
    description: 'Download video dan audio dari YouTube, TikTok, Instagram, Bilibili, Spotify terlengkap secara gratis tanpa aplikasi. Platform multi downloader terbaik 2025.',
    image: '/logo-inversave.webp',
    keywords: [
        'situs download video gratis',
        'download video sosmed gratis',
        'multi downloader online gratis',
        'video downloader indonesia terbaik',
        'unduh video online tanpa registrasi',
        'download video gratis tanpa aplikasi 2025',
        'website streaming dan download drama',
        'Dramabox', 'Netshort', 'Melolo', 'StardustTV'
    ]
};

export function constructMetadata({
    title,
    description,
    image,
    url,
    keywords,
    type = 'website',
    locale = 'id_ID',
    noIndex = false
}: SEOProps = {}): Metadata {
    const mergedTitle = title ? `${title} | Inversave` : defaultSEO.title;
    const mergedDescription = description || defaultSEO.description;
    const mergedImage = image || defaultSEO.image;
    const mergedKeywords = keywords ? [...defaultSEO.keywords, ...keywords] : defaultSEO.keywords;

    return {
        title: mergedTitle,
        description: mergedDescription,
        keywords: mergedKeywords,
        robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
        metadataBase: new URL(siteUrl),
        alternates: {
            canonical: url ? `${siteUrl}${url}` : siteUrl,
            languages: {
                'id': url ? `${siteUrl}/id${url}` : `${siteUrl}/id`,
                'en': url ? `${siteUrl}/en${url}` : `${siteUrl}/en`,
            }
        },
        openGraph: {
            title: mergedTitle,
            description: mergedDescription,
            url: url ? `${siteUrl}${url}` : siteUrl,
            siteName: 'Inversave',
            images: [
                {
                    url: mergedImage,
                    width: 1200,
                    height: 630,
                    alt: title || 'Inversave',
                },
            ],
            type,
            locale,
        },
        twitter: {
            card: 'summary_large_image',
            title: mergedTitle,
            description: mergedDescription,
            images: [mergedImage],
        },
        icons: {
            icon: '/logo-inversave.webp',
            apple: '/logo-inversave.webp',
        },
    };
}
