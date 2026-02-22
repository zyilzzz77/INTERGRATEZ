import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Download Video Bilibili & Anime HD Gratis | Inversave',
    description: 'Mencari cara download video Bilibili tanpa aplikasi? Gunakan Bilibili downloader online gratis kami untuk unduh anime HD dengan subtitle Indonesia tanpa login.',
    keywords: [
        'download bilibili',
        'unduh video bilibili',
        'bilibili downloader',
        'download anime bilibili',
        'bilibili video download',
        'cara download video bilibili tanpa aplikasi'
    ],
    openGraph: {
        title: 'Download Video Bilibili & Anime HD Gratis | Inversave',
        description: 'Unduh video dari Bilibili HD Sub Indo secara gratis tanpa aplikasi.',
        url: 'https://inversave.space/search/bilibili',
    },
};

export default function BilibiliLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
