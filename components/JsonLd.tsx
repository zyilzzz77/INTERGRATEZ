import { defaultSEO } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://inversave.space';

export default function JsonLd() {
    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Inversave',
        url: siteUrl,
        description: defaultSEO.description,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${siteUrl}/id/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };

    const webAppSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Inversave',
        url: siteUrl,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'All',
        description: defaultSEO.description,
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'IDR',
        },
        featureList: [
            'Download video YouTube',
            'Download video TikTok tanpa watermark',
            'Download Instagram Reels & Stories',
            'Download audio Spotify & SoundCloud',
            'Streaming drama DramaBox, Melolo, NetShort',
            'Multi-platform downloader',
        ],
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
    };

    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Inversave',
        url: siteUrl,
        logo: `${siteUrl}/logo-inversave.webp`,
        sameAs: [],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
        </>
    );
}
