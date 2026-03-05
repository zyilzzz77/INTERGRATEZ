import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const { getDictionary } = await import('@/lib/dictionary');
    const dict = await getDictionary(lang);
    const text = dict.searchLayout;

    return constructMetadata({
        title: text.title,
        description: text.description,
        url: `/${lang}/search`,
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
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default function SearchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
