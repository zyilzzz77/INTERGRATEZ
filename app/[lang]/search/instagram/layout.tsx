import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Instagram Downloader: Unduh Reels & Video Gratis | Inversave',
    description: 'Download video Instagram, Reels, Story, dan foto gratis tanpa login. Unduh Reels IG HD dan simpan video Instagram carousel semua dengan mudah.',
    keywords: [
        'download instagram',
        'unduh video instagram',
        'instagram downloader',
        'download reels instagram',
        'save foto instagram',
        'download story ig orang',
        'cara download video instagram tanpa aplikasi'
    ],
    openGraph: {
        title: 'Instagram Downloader: Unduh Reels & Video Gratis | Inversave',
        description: 'Download foto, video Carousel, Story, dan Reels Instagram secara gratis online.',
        url: 'https://inversave.space/search/instagram',
    },
};

export default function InstagramLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
