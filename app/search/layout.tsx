import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'All in One Video Downloader Semua Platform | Inversave',
    description: 'Cari dan download video online gratis dari semua platform. Multi platform video downloader terbaik untuk unduh konten sosial media terlengkap 2025.',
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
        title: 'All in One Video Downloader Semua Platform | Inversave',
        description: 'Cari dan download video online gratis dari berbagai platform secara instan tanpa login.',
        url: 'https://inversave.space/search',
    },
};

export default function SearchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
