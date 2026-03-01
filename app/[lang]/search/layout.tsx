import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    const { getDictionary } = await import('@/lib/dictionary');
    const dict = await getDictionary(lang);
    const text = dict.searchLayout;

    return {
        title: text.title,
        description: text.description,
        keywords: [
            'cari video online gratis',
            'search video downloader semua platform',
            'download video dari berbagai platform',
            'multi platform video downloader',
            'situs download video semua sosmed',
            'cara download video dari sosial media',
            'all in one video downloader online',
            'download video online gratis semua platform',
            'situs unduh video terlengkap',
            'video downloader terbaik 2025'
        ],
        openGraph: {
            title: text.ogTitle,
            description: text.ogDescription,
            url: 'https://inversave.space/search',
        },
    };
}

export default function SearchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
