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
    title: 'Inversave — Download Video Sosmed & Streaming Gratis',
    description: 'Download video gratis dari YouTube, TikTok, Instagram, Bilibili, Spotify, dan SoundCloud tanpa aplikasi. Nonton streaming drama online gratis di DramaBox, Melolo, NetShort. Multi downloader terbaik Indonesia 2025.',
    image: '/logo-inversave.webp',
    keywords: [
        'download video gratis',
        'download video sosmed',
        'multi downloader online',
        'video downloader indonesia',
        'unduh video tanpa registrasi',
        'download video tanpa aplikasi 2025',
        'streaming drama gratis',
        'nonton drama online gratis',
        'download youtube mp4',
        'download tiktok tanpa watermark',
        'download instagram reels',
        'download spotify mp3',
        'DramaBox', 'NetShort', 'Melolo', 'StardustTV', 'DramaWave',
        'inversave', 'inversave.space'
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
