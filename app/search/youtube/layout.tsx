import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Download Video YouTube & MP3 Gratis | Inversave',
    description: 'Unduh video YouTube HD 1080p dan convert YouTube to MP3 320kbps online gratis tanpa software. Download playlist dan YouTube Shorts dengan mudah.',
    keywords: [
        'download youtube',
        'unduh video youtube',
        'youtube downloader',
        'download video yt',
        'youtube to mp4',
        'cara download video youtube gratis'
    ],
    openGraph: {
        title: 'Download Video YouTube & MP3 Gratis | Inversave',
        description: 'Unduh video YouTube HD & MP3 320kbps secara online tanpa aplikasi.',
        url: 'https://inversave.space/search/youtube',
    },
};

export default function YoutubeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
